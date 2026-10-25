# Python ses analizi / Python audio analysis — 4.0.6 Beta

## Türkçe

Eklenti hâlâ sunucusuzdur; Python aracı isteğe bağlı ve ayrıdır. Canlı YouTube Music sesini Python'a göndermez. Yerel dosyaları inceler; ağ bağlantısı, dosya yüklemesi veya sunucu kullanmaz.

Gereksinimler: Python 3.10+, FFmpeg (ffmpeg ve ffprobe PATH üzerinde), NumPy. Windows, Linux ve macOS için standart Python kodudur; bu sürümün çalıştırma kontrolleri macOS'ta yapılmıştır.

Paketin ana klasöründe bir kere:

```sh
python -m pip install -r tools/audio-analysis-requirements.txt
```

macOS/Linux'ta sisteminizde gerekirse `python` yerine `python3` kullanın. Python ortamınızı tercih ettiğiniz şekilde ayrı tutabilirsiniz. Ardından:

```sh
python tools/audio_analysis.py "parca.mp3" "diger.wav" --output "sonuclar"
python tools/audio_analysis.py --self-test
```

`report.json` ayrıntıları, `REPORT.md` okunabilir özeti içerir. Aynı çıktı klasöründe raporlar yeniden yazılır. Ses dosyaları değiştirilmez. Hatalı dosyalar rapora eklenir, diğer dosyalar işlenir ve işlem hata koduyla biter.

Ölçümler: 8192 noktalı Hann spektrumu, 2048 adım; 8–16 ve 19–20 kHz enerji oranları; 14–20 kHz çevresinde yaklaşık 500 Hz yumuşatılmış spektral örnekler; enerji ağırlıklı stereo coherence ve çapraz faz yoğunlaşması; 49–51 Hz enerji-zarfı modülasyon belirginliği. En fazla altı ayrı 20 saniyelik pencere incelenir. Kısa kayıtlarda pencereler örtüşebilir; örneklem bütün kayıt değildir.

**Sınırlar:** YZ/human kararı, olasılık yüzdesi veya doğrulanmış Suno filigranı üretmez. 50 Hz ölçümü bölgedeki en yüksek tepeyi komşu medyana karşı karşılaştırır; pozitif değer tek başına anlamlı bulgu değildir. 99% rolloff, keskin frekans kesilmesinin konumu değildir. Faz ölçümleri miks düzeyindedir; vokal ayırma ve F1/F2 takibi yoktur. Kaynak örnekleme hızı ve kayıplı codec yüksek frekansları sınırlar. C2PA doğrulaması ve SynthID/AudioSeal çözücüsü içermez. Metadata metni güvenilir üretim kanıtı sayılmaz.

## English

The extension remains serverless. This optional offline Python tool analyzes selected local files; it is not connected to live tab capture or automatic skipping. It uploads no audio and requires no helper server.

Install Python 3.10+, FFmpeg/ffprobe on PATH, then NumPy using the requirements command above. Run the analyzer with one or more quoted file paths and `--output`. `--self-test` checks synthetic amplitude modulation, channel inversion and silence. Reports in an existing output directory are overwritten; input audio is unchanged. macOS execution was verified; Windows/Linux live verification has not been performed.

The tool measures spectral band energy, spectral anchors, stereo coherence, cross-phase concentration and envelope modulation near 50 Hz. It analyzes up to six 20-second windows, not every sample of a long recording. These features are exploratory, not AI probabilities, proprietary watermark verification or evidence of a specific generator. Original sample rate, compression, musical content and mastering can affect every measurement. No vocal separation or formant tracking is implemented.

## Research context

- SONICS: https://arxiv.org/abs/2408.14080 — synthetic song data and learned detection; this tool does not reproduce SpecTTTra.
- EnCodec: https://arxiv.org/abs/2210.13438 — neural compression; frame rate does not by itself establish a Suno-specific 50 Hz watermark.
- AudioSeal: https://github.com/facebookresearch/audioseal — a separate learned watermark generator/detector, not implemented here. Do not infer Suno use from this publication.
- Suno credentials: https://suno.com/suno-credentials — C2PA verification, separate from these signal measurements.

This analyzer is an exploratory implementation, not a validated reproduction of a named paper's detection protocol.
