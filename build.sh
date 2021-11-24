SRC_DIR=$(cd `dirname $0`;pwd)

if [ x"$1" = x"-c" ]; then
    rm -fr node_modules
    rm -fr nodejs
    rm -fr release/*
    rm -fr *-lock.json
	rm -fr static
	rm -fr log
	rm -fr cache
	rm -fr *.lock
	rm -fr *.log
fi

sh nodejs_check.sh

export PATH=$PATH:$SRC_DIR/nodejs/bin

cd $SRC_DIR
rm -fr release
npm i -g yarn
yarn
yarn run buildserver
yarn run buildclient
