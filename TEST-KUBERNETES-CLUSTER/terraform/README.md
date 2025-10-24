# Kubernetes Cluster Terraform Deployment

This Terraform configuration deploys a Kubernetes cluster on existing VirtualBox VMs.

## Cluster Architecture

- **Controller Node**: 100.64.0.91 (kcontroller)
- **Worker Nodes**:
  - 100.64.0.92 (kworker-001)
  - 100.64.0.93 (kworker-002)

## Prerequisites

1. **sshpass** - Install on your local machine:
   ```bash
   # macOS
   brew install hudochenkov/sshpass/sshpass

   # Ubuntu/Debian
   sudo apt-get install sshpass
   ```

2. **Terraform** - Version >= 1.0
   ```bash
   # macOS
   brew install terraform

   # Ubuntu/Debian
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

3. **SSH Access** - Ensure all VMs are accessible via SSH with the credentials specified in `variables.tf`

## Deployment Steps

1. **Initialize Terraform**:
   ```bash
   cd terraform
   terraform init
   ```

2. **Review the Plan**:
   ```bash
   terraform plan
   ```

3. **Deploy the Cluster**:
   ```bash
   terraform apply
   ```

   Type `yes` when prompted to confirm.

4. **Access the Cluster**:
   After successful deployment, a `kubeconfig` file will be downloaded to the terraform directory.

   ```bash
   export KUBECONFIG=$(pwd)/kubeconfig
   kubectl get nodes
   ```

## Configuration

You can customize the deployment by modifying `variables.tf` or creating a `terraform.tfvars` file:

```hcl
controller_ip      = "100.64.0.91"
worker_ips         = ["100.64.0.92", "100.64.0.93"]
ssh_user           = "vboxuser"
ssh_password       = "0135"
kubernetes_version = "1.28"
pod_network_cidr   = "10.244.0.0/16"
service_cidr       = "10.96.0.0/12"
```

## What Gets Deployed

1. **All Nodes**:
   - Disables swap
   - Installs containerd runtime
   - Configures kernel modules and sysctl parameters
   - Installs kubeadm, kubelet, and kubectl

2. **Controller Node**:
   - Initializes Kubernetes cluster with kubeadm
   - Installs Flannel CNI plugin
   - Generates join token for workers

3. **Worker Nodes**:
   - Joins the cluster using the generated token

## Verify Deployment

```bash
# Check node status
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system

# Check cluster info
kubectl cluster-info
```

## Cleanup

To destroy the cluster:

```bash
terraform destroy
```

**Note**: This will NOT uninstall Kubernetes packages from the VMs. To fully clean up, you'll need to manually run on each node:

```bash
sudo kubeadm reset -f
sudo apt-get purge -y kubeadm kubectl kubelet kubernetes-cni
sudo apt-get autoremove -y
sudo rm -rf ~/.kube /etc/kubernetes /var/lib/etcd /var/lib/kubelet /var/lib/dockershim /var/run/kubernetes
```

## Troubleshooting

### SSH Connection Issues
- Verify VMs are running and accessible
- Check SSH credentials in `variables.tf`
- Test manual SSH: `sshpass -p 0135 ssh vboxuser@100.64.0.91`

### Cluster Initialization Fails
- Check if swap is disabled: `sudo swapon --show`
- Verify containerd is running: `sudo systemctl status containerd`
- Check logs: `sudo journalctl -xeu kubelet`

### Worker Nodes Won't Join
- Ensure the controller node is fully initialized
- Check network connectivity between nodes
- Verify the join token hasn't expired

## Network Configuration

- **Pod Network**: 10.244.0.0/16 (Flannel)
- **Service Network**: 10.96.0.0/12
- **CNI Plugin**: Flannel
