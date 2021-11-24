call yarn
call npm run buildserver
call npm run buildclient
md release\config
copy config release\config
echo node bin\serverApp.js > release/start.bat