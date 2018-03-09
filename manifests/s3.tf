# API
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.resource_prefix}-${var.aws_region}-artifacts"
  acl = "private"
  force_destroy = true
  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket_object" "app" {
  bucket = "${aws_s3_bucket.artifacts.bucket}"
  key = "app.zip"
  source = "./.build/app.zip"
  etag = "${md5(file("./.build/app.zip"))}"
}

# Client
data "template_file" "bucket_policy" {
  template = "${file("./manifests/policies/public-bucket-policy.json")}"

  vars {
    bucket_prefix = "${var.resource_prefix}"
  }
}

resource "aws_s3_bucket" "www" {
  bucket = "${var.resource_prefix}-www"
  acl = "public-read"
  force_destroy = true
  policy = "${data.template_file.bucket_policy.rendered}"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
  depends_on = ["data.template_file.bucket_policy"]
}

data "external" "client_build" {
  # Get the SHA of the built client files directory
  program = ["bash", "${path.module}/scripts/generate-sha.sh"]
}

resource "null_resource" "deploy_s3" {
  triggers = {
    content = "${data.external.client_build.result["sha"]}"
  }

  provisioner "local-exec" {
    command = <<EOF
            cd ./bracket
            echo DO THE THING!
            aws s3 sync --delete --cache-control="no-cache,no-store,must-revalidate" . s3://${aws_s3_bucket.www.bucket}
EOF
  }
}