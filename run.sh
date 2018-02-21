#!/usr/bin/env bash
set -e

BACKEND_BUCKET="bucket=music-madness-tf-state"
BRANCH="master"

build() {
    echo -e "\n########## Starting API Build ##########\n"

    mkdir -p ./.build/
    pushd api
    zip -r ../.build/app.zip .
    popd
}


plan() {

    echo "DOIN"

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


    terraform plan \
      -var-file=manifests/variables/dev.tfvars \
      -var="resource_prefix=mm" \
      -refresh=true \
      -parallelism=2 \
      manifests/

}

for ARG in "$@"; do
    echo "Running \"$ARG\""
    $ARG
done