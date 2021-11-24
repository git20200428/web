DEST_DIR=`pwd`;
if [ -n "$1" ]; then
  DEST_DIR=$1;
fi
echo ${DEST_DIR}
PLATFM="x64"
if [ -n "$2" ]; then
  PLATFM=$2;
fi
echo ${PLATFM}

ART_HOSTNAME=https://sh-artifactory.infinera.com;
if [ -n "$3" ]; then
  ART_HOSTNAME=$3;
fi
echo ${ART_HOSTNAME}

if [ ! -d ${DEST_DIR}/nodejs ]; then
    cd ${DEST_DIR}
    NODEV=node-v16.13.0-linux-${PLATFM}
    NODE=${NODEV}.tar.xz
    wget -q ${ART_HOSTNAME}/artifactory/thanos/com/webgui/${NODE}
    tar -xf ${NODE}
    mv ${NODEV} nodejs
    rm ${NODE}
fi
