output "controller_ip" {
  description = "IP address of the Kubernetes controller node"
  value       = var.controller_ip
}

output "worker_ips" {
  description = "IP addresses of the Kubernetes worker nodes"
  value       = var.worker_ips
}

output "kubeconfig_location" {
  description = "Location of the downloaded kubeconfig file"
  value       = "${path.module}/kubeconfig"
}

output "cluster_info" {
  description = "Information about the Kubernetes cluster"
  value = {
    controller    = var.controller_ip
    workers       = var.worker_ips
    pod_cidr      = var.pod_network_cidr
    service_cidr  = var.service_cidr
    k8s_version   = var.kubernetes_version
  }
}
