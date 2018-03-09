#!/usr/bin/env bash
set -e

BACKEND_BUCKET="bucket=music-madness-tf-state"
BRANCH="master"

workflow() {
    echo -e "\n########## Starting Workflow ##########\n"
    build
    deploy
}

build() {
    echo -e "\n########## Starting API Build ##########\n"

    mkdir -p ./.build/
    pushd api
    zip -r ../.build/app.zip .
    popd
}


deploy() {

    echo -e "\n########## Running Deployment ##########\n"

    cd manifests

    terraform init \
      -backend=true \
      -backend-config="$BACKEND_BUCKET" \
      -backend-config="key=terraform.tfstate" \
      -backend-config="region=us-east-1"

    terraform env new ${BRANCH} || true
    terraform env select ${BRANCH}

    cp -r .terraform/ ../.terraform/
    cd ../

    terraform apply \
      -var-file=manifests/variables/dev.tfvars \
      -var="resource_prefix=mm" \
      -var="spotify_clientid=${CLIENT_ID}" \
      -var="spotify_secret=${SECRET}" \
      -var="slack_token=${SLACK_TOKEN}" \
      -refresh=true \
      -parallelism=2 \
      manifests/

    terraform apply \
      -var-file=manifests/variables/dev.tfvars \
      -var="resource_prefix=mm" \
      -var="spotify_clientid=${CLIENT_ID}" \
      -var="spotify_secret=${SECRET}" \
      -var="slack_token=${SLACK_TOKEN}" \
      -refresh=true \
      -parallelism=2 \
      manifests/
}

for ARG in "$@"; do
    echo "Running \"$ARG\""
    $ARG
done