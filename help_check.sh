DEST_DIR=`pwd`;
if [ -n "$1" ]; then
  DEST_DIR=$1;
fi
echo ${DEST_DIR}

ART_HOSTNAME=https://sh-artifactory.infinera.com;
if [ -n "$2" ]; then
  ART_HOSTNAME=$2;
fi
echo ${ART_HOSTNAME}

cd ${DEST_DIR}

ProductName="G40"
if [ -n "$3" ]; then
  ProductName=$3;
fi
echo ${ProductName}

rm -fr documentation
if [ ${ProductName} != "frcu31" ]; then
  HELPFILE1=G40_R4.1_Online_Documentation_v03.tar
  wget -q ${ART_HOSTNAME}/artifactory/thanos/com/webgui/help/${HELPFILE1}
  tar -xf ${HELPFILE1}
  rm ${HELPFILE1}
  mv *Online_Documentation documentation
fi

rm -fr webgui_help
HELPFILE2=G40_R5.0_webgui_help_v01.tar
if [ ${ProductName} = "frcu31" ]; then
  HELPFILE2=G30_R5.0_webgui_help_v01.tar
fi
wget -q ${ART_HOSTNAME}/artifactory/thanos/com/webgui/help/${HELPFILE2}
tar -xf ${HELPFILE2}
rm ${HELPFILE2}
