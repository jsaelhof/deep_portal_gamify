# Deep Portal Web

Interactive documentation for our Deep Portal SPA

## Prerequisites:

 - `brew install node` (or `apt-get install nodejs`)
 - `brew install nginx` (or `apt-get install nginx`)

## Install (only modifies local project directory)

 - `npm install` => creates node_modules with dependencies (similar to a .m2 directory)
   - `npm install --no-bin-links` => for shared drives, or when symlinks cannot be created
 - `npm install -g watchify` => installs watchify command
   - `npm install -g watchify --no-bin-links` => for shared drives, or when symlinks cannot be created

## Test it

 - `npm run-script test`

## Run it

 - `npm run-script watch` => starts a watcher that will rebuild when files change
 - `npm run-script nginx` => starts a reverse proxy to bypass SOP (use `pkill nginx` to shut down nginx)

Now you can hit localhost:3030 to see the console.

## Build it

 - `npm run-script build`

## Deploy Themes to S3

 - ensure that you have the AWS CLI client installed
 - ensure you have AWS creditials
 - `aws s3 sync <local-path> s3://<bucket>/<path> --acl public-read`


