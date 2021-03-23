# Deep Portal Web

###### Dashboard
![image](https://user-images.githubusercontent.com/7939225/112181266-e1e8a000-8bc1-11eb-9f3e-87cdea7cb3e3.png)

###### Game Preview
![image](https://user-images.githubusercontent.com/7939225/112181094-b9f93c80-8bc1-11eb-83e2-2c7ab5a732b2.png)

###### Full Campain Editor

![portal deepmarkit com_dashboard_slideout_gamify_edit_jHT6VdPbkdAp61zGTvIvm93EMpfmEYKSBPJkDSPpej0_needsPreview=true](https://user-images.githubusercontent.com/7939225/112181388-06dd1300-8bc2-11eb-8a44-bde1269fe3ae.png)

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


