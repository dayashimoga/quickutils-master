# Secure Terraform State Management (Cloud & Free)

This guide explains how to store your Terraform state files securely in the cloud without spending money and, crucially, without committing them to your Git repository.

## ⚠️ Why you must NOT commit state to Git
Terraform state files (`terraform.tfstate`) often contain **sensitive information** in plain text, such as database passwords, API keys, or private IP addresses. Committing them to Git is a major security risk.

## Option 1: HCP Terraform (Recommended)
HashiCorp offers a **Free Tier** for HCP Terraform (formerly Terraform Cloud) that includes managed remote state for up to 5 users.

### Steps:
1.  **Sign up**: Create a free account at [app.terraform.io](https://app.terraform.io).
2.  **Create a Workspace**: Select "CLI-driven workflow".
3.  **Update your code**: Add the `cloud` block to your `main.tf`:
    ```hcl
    terraform {
      cloud {
        organization = "quickutils"
        workspaces {
          name = "quickutils_wn"
        }
      }
    }
    ```
4.  **Login**: Run `terraform login` in your terminal to authenticate.
5.  **Initialize**: Run `terraform init`. Your state will be migrated to the cloud.

## Option 2: Cloudflare R2 (S3-Compatible)
Cloudflare R2 has a generous **Free Tier** (10 GB/month) and zero egress fees. You can use it with Terraform's `s3` backend.

### Steps:
1.  **Create Bucket**: In the Cloudflare Dashboard, create an R2 bucket (e.g., `my-terraform-state`).
2.  **Get Credentials**: Create an R2 API token with "Edit" permissions and note the Access Key and Secret Key.
3.  **Update your code**:
    ```hcl
    terraform {
      backend "s3" {
        bucket                      = "my-terraform-state"
        key                         = "dev/terraform.tfstate"
        region                      = "auto"
        endpoint                    = "https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
        access_key                  = "YOUR_ACCESS_KEY"
        secret_key                  = "YOUR_SECRET_KEY"
        skip_credentials_validation = true
        skip_region_validation      = true
        skip_metadata_api_check     = true
      }
    }
    ```
    > [!IMPORTANT]
    > **Never hardcode keys.** Use environment variables: `export AWS_ACCESS_KEY_ID=...` and `export AWS_SECRET_ACCESS_KEY=...`.

## 🛡️ Best Practices
1.  **Add to `.gitignore`**: Ensure your project has a `.gitignore` file with:
    ```
    *.tfstate
    *.tfstate.*
    .terraform/
    .terraform.lock.hcl
    terraform.tfvars
    ```
2.  **Enable Locking**: Remote backends like HCP Terraform and S3/R2 support **State Locking**, which prevents two users from corrupting the state by running Terraform simultaneously.
3.  **Encryption**: Most cloud backends (including HCP and R2) encrypt your state at rest by default.
## 🛠️ Local Configuration
The `terraform/` folder in this repository contains the implementation:
- `main.tf`: Contains the Cloudflare Pages logic and your `cloud` block.
- `variables.tf`: Define your project names and GitHub info here.
- `providers.tf`: Sets up the Cloudflare connection.
- `terraform.tfvars.example`: Use this to provide your secret API tokens.

To get started:
1.  `cd terraform`
2.  `cp terraform.tfvars.example terraform.tfvars` (And fill in your details)
3.  `terraform init`
4.  `terraform apply`
