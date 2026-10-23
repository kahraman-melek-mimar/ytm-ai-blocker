# Known limitations / Bilinen sınırlar

YTM AI Blocker can make mistakes. It is not recommended for DJ or classical music. Model scores are not calibrated probabilities and cannot establish provenance. Genuine music can score high; generated music can score low. No measured genre-specific accuracy guarantee is provided.

YTM AI Blocker hata yapabilir. DJ ve klasik müzik için önerilmez. Model skoru kalibre olasılık veya üretim kanıtı değildir. Özgün müzik yüksek, YZ müzik düşük skor alabilir. Tür bazında ölçülmüş doğruluk garantisi yoktur.

The numerical guard corrects exact-zero denominators in two HPSS divisions of the pinned graph, without altering the source file or weights. Eight previously non-finite sample windows returned finite scores in local checks; eleven previously finite comparison windows were unchanged. Those are numerical regression checks, not detection benchmarks. Some recovered windows from user-designated human recordings scored high: fixing numerical failures does not fix false positives.

Sayısal düzeltme, sabit grafikteki iki HPSS bölmesinde tam sıfır paydayı korur. Özgün dosya/ağırlıklar değiştirilmez. Önceden geçersiz olan sekiz örnek sonlu sonuç verdi; önceden geçerli on bir karşılaştırma örneği aynı kaldı. Bu, doğruluk testi değil sayısal regresyondur. Kullanıcının insan üretimi olarak belirttiği bazı kayıtlarda düzeltilen pencereler yüksek skor verdi; yanlış pozitif sorunu devam edebilir.

The live production label is text evidence. C2PA reading is a separate optional local-file tool. SynthID is not decoded. C2PA metadata may not be available in a YouTube stream; absence does not mean human origin. Automatic skip history is local and based on an observed track change after a next-button click, not a server-confirmed playback audit.
