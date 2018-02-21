resource "aws_iam_role" "lambda_execution" {
  name = "${var.resource_prefix}-lambda-execution"
  assume_role_policy = "${file("./manifests/policies/assume-lambda-role.json")}"
}