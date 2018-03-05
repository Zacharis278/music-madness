resource "aws_iam_role" "lambda_execution" {
  name = "${var.resource_prefix}-lambda-execution"
  assume_role_policy = "${file("./manifests/policies/assume-lambda-role.json")}"
}

data "template_file" "lambda_execution_policy" {
  template = "${file("./manifests/policies/lambda-execution-policy.json")}"
  vars {
    aws_account_id = "${data.aws_caller_identity.current.account_id}"
    aws_region = "${var.aws_region}"
    resource_prefix = "${var.resource_prefix}"
  }
}

resource "aws_iam_role_policy" "lambda_execution_policy" {
  name = "${var.resource_prefix}-lambda-execution-policy"
  role = "${aws_iam_role.lambda_execution.id}"
  policy = "${data.template_file.lambda_execution_policy.rendered}"
}