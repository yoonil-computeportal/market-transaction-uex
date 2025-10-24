variable "controller_ip" {
  description = "IP address of the Kubernetes controller node"
  type        = string
  default     = "100.64.0.91"
}

variable "worker_ips" {
  description = "List of IP addresses for Kubernetes worker nodes"
  type        = list(string)
  default     = ["100.64.0.92", "100.64.0.93"]
}

variable "ssh_user" {
  description = "SSH username for all nodes"
  type        = string
  default     = "vboxuser"
}

variable "ssh_password" {
  description = "SSH password for all nodes"
  type        = string
  default     = "0135"
  sensitive   = true
}

variable "kubernetes_version" {
  description = "Kubernetes version to install"
  type        = string
  default     = "1.28"
}

variable "pod_network_cidr" {
  description = "CIDR for pod network"
  type        = string
  default     = "10.244.0.0/16"
}

variable "service_cidr" {
  description = "CIDR for services"
  type        = string
  default     = "10.96.0.0/12"
}
