# Deploy prerequisites on all nodes
resource "null_resource" "prepare_all_nodes" {
  count = length(var.worker_ips) + 1

  provisioner "remote-exec" {
    connection {
      type     = "ssh"
      host     = count.index == 0 ? var.controller_ip : var.worker_ips[count.index - 1]
      user     = var.ssh_user
      password = var.ssh_password
    }

    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y apt-transport-https ca-certificates curl",
      "sudo swapoff -a",
      "sudo sed -i '/ swap / s/^/#/' /etc/fstab",

      # Load kernel modules
      "sudo modprobe overlay",
      "sudo modprobe br_netfilter",

      # Set up required sysctl params
      "cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf",
      "overlay",
      "br_netfilter",
      "EOF",

      "cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf",
      "net.bridge.bridge-nf-call-iptables  = 1",
      "net.bridge.bridge-nf-call-ip6tables = 1",
      "net.ipv4.ip_forward                 = 1",
      "EOF",

      "sudo sysctl --system",

      # Install containerd
      "sudo apt-get install -y containerd",
      "sudo mkdir -p /etc/containerd",
      "containerd config default | sudo tee /etc/containerd/config.toml",
      "sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml",
      "sudo systemctl restart containerd",
      "sudo systemctl enable containerd",

      # Install Kubernetes components
      "sudo mkdir -p /etc/apt/keyrings",
      "curl -fsSL https://pkgs.k8s.io/core:/stable:/v${var.kubernetes_version}/deb/Release.key -o /tmp/k8s-key",
      "cat /tmp/k8s-key | sudo gpg --dearmor --batch --yes -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg 2>/dev/null || sudo cp /tmp/k8s-key /etc/apt/keyrings/kubernetes-apt-keyring.gpg",
      "echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v${var.kubernetes_version}/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list",
      "sudo apt-get update",
      "sudo apt-get install -y kubelet kubeadm kubectl",
      "sudo apt-mark hold kubelet kubeadm kubectl"
    ]
  }
}

# Initialize controller node
resource "null_resource" "init_controller" {
  depends_on = [null_resource.prepare_all_nodes]

  provisioner "remote-exec" {
    connection {
      type     = "ssh"
      host     = var.controller_ip
      user     = var.ssh_user
      password = var.ssh_password
    }

    inline = [
      "sudo kubeadm init --pod-network-cidr=${var.pod_network_cidr} --service-cidr=${var.service_cidr} --apiserver-advertise-address=${var.controller_ip}",

      # Set up kubeconfig for the user
      "mkdir -p $HOME/.kube",
      "sudo cp -f /etc/kubernetes/admin.conf $HOME/.kube/config",
      "sudo chown $(id -u):$(id -g) $HOME/.kube/config",

      # Install Flannel CNI
      "kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml",

      # Generate join command for workers
      "kubeadm token create --print-join-command > /tmp/kubeadm_join_cmd.sh",
      "chmod +x /tmp/kubeadm_join_cmd.sh"
    ]
  }

  provisioner "local-exec" {
    command = "sshpass -p ${var.ssh_password} scp ${var.ssh_user}@${var.controller_ip}:/tmp/kubeadm_join_cmd.sh ./scripts/join_command.sh"
  }
}

# Join worker nodes to the cluster
resource "null_resource" "join_workers" {
  count      = length(var.worker_ips)
  depends_on = [null_resource.init_controller]

  provisioner "local-exec" {
    command = "sleep 30"
  }

  provisioner "file" {
    connection {
      type     = "ssh"
      host     = var.worker_ips[count.index]
      user     = var.ssh_user
      password = var.ssh_password
    }

    source      = "./scripts/join_command.sh"
    destination = "/tmp/kubeadm_join_cmd.sh"
  }

  provisioner "remote-exec" {
    connection {
      type     = "ssh"
      host     = var.worker_ips[count.index]
      user     = var.ssh_user
      password = var.ssh_password
    }

    inline = [
      "sudo bash /tmp/kubeadm_join_cmd.sh"
    ]
  }
}

# Copy kubeconfig to local machine
resource "null_resource" "copy_kubeconfig" {
  depends_on = [null_resource.join_workers]

  provisioner "local-exec" {
    command = "sshpass -p ${var.ssh_password} scp ${var.ssh_user}@${var.controller_ip}:~/.kube/config ./kubeconfig"
  }
}
