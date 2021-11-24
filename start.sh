WEBPATH=/opt/infinera/thanos/local/www
export PATH=${WEBPATH}/nodejs/bin:$PATH
cd $WEBPATH
ip vrf exec default node ./bin/serverApp.js
