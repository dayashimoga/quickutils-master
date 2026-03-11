variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "github_username" {
  description = "GitHub Username"
  type        = string
  default     = "dayashimoga"
}

variable "projects" {
  description = "Map of projects and their configurations"
  type        = map(object({
    directory = string
    repo_name = string
  }))
  default = {} # Will be overridden or ignored if using local file load in main.tf
}

locals {
  projects = jsondecode(file("${path.module}/projects.json"))
}

variable "ga_measurement_id" {
  description = "Google Analytics Measurement ID"
  type        = string
  default     = "G-QPDP38ZCCV"
}

variable "adsense_publisher_id" {
  description = "Google AdSense Publisher ID"
  type        = string
  default     = "ca-pub-5193703345853377"
}

variable "amazon_affiliate_tag" {
  description = "Amazon Affiliate Tag"
  type        = string
  default     = "quickutils-20"
}
