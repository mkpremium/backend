sudo apt-get install software-properties-common
sudo add-apt-repository universe

sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot


node -r dotenv/config cli/cli-onwers-verify.js ~/picked_data/CSV/PROPIETARIOS.csv


crontab
0 0 1 1,4,7,10 *  /home/ubuntu/renew-prod-cert.sh >> /home/ubuntu/renew-prod-cert.log 2>&1
0 0 15 2,5,8,11 *   /home/ubuntu/renew-prod-cert.sh >> /home/ubuntu/renew-prod-cert.log 2>&1
