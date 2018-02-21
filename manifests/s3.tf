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