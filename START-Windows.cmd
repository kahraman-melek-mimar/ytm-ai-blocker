@echo off
setlocal
set "YTM_CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "YTM_CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined YTM_CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "YTM_CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined YTM_CHROME if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "YTM_CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if defined YTM_CHROME (
  start "" "%YTM_CHROME%" "%~dp0START.html" "chrome://extensions/" "https://music.youtube.com/"
) else (
  start "" "%~dp0START.html"
)
endlocal
