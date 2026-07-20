@echo off
title Chef Online
echo Arrancando Chef Online...
cd /d C:\proyectos\roberto-chefonline.es\app_web
start "" "http://localhost:3000"
npm run dev
