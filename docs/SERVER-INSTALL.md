# V3.4.1 — LOCAL SERVER REQUIRED / YEREL SUNUCU GEREKLİ

This is the **server edition**. It does not run audio inference inside the extension. Both the local Python helper and the extension are required. The server-free product is [V4 Beta](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/releases/tag/v4.0.4-beta.1).

Bu **sunuculu üründür**. Ses modeli Python yardımcısında çalışır. Modeli analiz sırasında açık tutmanız gerekir. Sunucusuz eklenti için V4 Beta'yı indirin. V3 ve V4'ü aynı YouTube Music sayfasında birlikte etkinleştirmeyin.

## Download / İndir

Download `ytm-ai-blocker-3.4.1-server.zip` from the v3.4.1 release and extract it. Open a terminal in the extracted project folder. Requirements: Chrome/Chromium 116+, Python 3.10+, internet for initial dependencies/model download.

v3.4.1 yayınından `ytm-ai-blocker-3.4.1-server.zip` indirin ve açın. Terminali içindeki proje klasöründe açın. İlk kurulum internet gerektirir. Model dosyaları bu ZIP'te bulunmaz; model sahibinden kurulumda indirilir.

## macOS

Run `Install.command` / `Kurulum.command` once, then `Start.command` / `Başlat.command` whenever using analysis. Keep the server window open. Alternatively:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r server/requirements.txt
.venv/bin/python server/download_model.py
.venv/bin/python server/server.py
```

## Linux

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r server/requirements.txt
.venv/bin/python server/download_model.py
.venv/bin/python server/server.py
```

The Python venv module must be installed on the system. These are manual instructions; Linux live playback has not been verified in this release.

## Windows — PowerShell

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r server/requirements.txt
.\.venv\Scripts\python.exe server/download_model.py
.\.venv\Scripts\python.exe server/server.py
```

Use Python 3.10+ with a compatible ONNX Runtime wheel. Windows live playback has not been verified in this release. `.command` launchers are macOS-only.

## Load the extension / Eklentiyi yükle

1. Keep the server running / Sunucuyu açık bırakın.
2. Open `chrome://extensions`, enable Developer mode / Geliştirici modunu açın.
3. Choose Load unpacked / Paketlenmemiş öğe yükle and select `extension/`.
4. Refresh YouTube Music, play audio, and click the extension toolbar icon / Sayfayı yenileyin, müzik çalın ve eklenti simgesine tıklayın.

The service binds only to `127.0.0.1:5050`. Do not expose it to the internet. It requires no cloud account. Audio is sent only to your local helper, not to a remote inference service. Port already in use means another helper may be running; do not start duplicate instances. Stop the helper with Ctrl+C in its own terminal.

Sunucu yalnızca kendi bilgisayarınızdaki `127.0.0.1:5050` adresini dinler. İnternete açmayın. Canlı ses uzak analiz hizmetine gönderilmez. Kurulumdan sonra analiz için sunucuyu yeniden başlatmanız gerekir; bilgisayar açılınca kendiliğinden başlamaz.

Model estimates can be wrong. DJ/classical music is not recommended. A model score is not proof of production origin. Model license is CC BY-NC 4.0 with additional owner notices; commercial rights are not granted by this application. See THIRD_PARTY_NOTICES.md.
