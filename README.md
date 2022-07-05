<p align="center">
    <h2 align="center">Wuno Bot</h2>
    <span><p align="center">Bot whatsapp yang berguna untuk bermain UNO.</p></span>
</p>

> Project ini terinspirasi dari [Exium1/UnoBot](https://github.com/exium1/unobot) dan [mjsalerno/UnoBot](https://github.com/mjsalerno/UnoBot) yang beberapa asset dan logika pemrograman juga terdapat dalam project ini.

Bot ini adalah bot whatsapp yang memungkinkan pengguna untuk bermain UNO langsung di whatsapp. Dengan menjapri bot, mengirimkan kode permainan ke teman anda, dan memulai permainan kamu bisa bermain UNO seperti kamu bermain dengan teman langsung.

## Sebelum Menggunakan

Bot ini menyimpan data **nomor telepon** serta **username** pemain untuk keperluan mekanisme permainan.

Jika kamu adalah orang yang menjalankan bot ini, kamu **wajib** bertanggung jawab atas data-data pemain yang tersimpan. **Jangan** melimpahkan data pribadi ke pihak yang tidak bertanggung jawab. Jika mereka ingin menghapus data pribadi mereka, kamu **wajib** menghapusnya.

Jika kamu adalah pemain, kamu berarti telah **mengetahui** serta **menyetujui** bahwa kamu **mengizinkan** datamu untuk disimpan ke bot lawan bicara. Jika ingin **menghapus** data, silahkan **hubungi operator bot** yang bertanggung jawab.

### Pesan untuk Administrator

Untuk menghindari kejadian yang tidak diinginkan, lebih baik menggunakan Database MongoDB yang di host secara local. Kemudian, disarankan untuk tidak menghosting bot secara 24 jam, host bot secara local memang pada saat dibutuhkan.

### Pesan untuk Pemain

Pilihlah bot dengan administrator yang bertanggung jawab dan dapat dipercaya. Lebih dari itu, pilihlah administrator yang mengerti dan teman dekatmu.

## Prerequisites

Anda butuh

- Node.js dan NPM (atau Package Manager lainnya)
- MongoDB untuk menyimpan data

## Pemakaian

### Cloning Dari Github

Jalankan perintah ini Command Line.

```sh
# HTTPS
git clone https://github.com/reacto11mecha/wuno-bot.git

# SSH
git clone git@github.com:reacto11mecha/wuno-bot.git
```

### Menginstall package

Anda ke root directory project dan menginstall package yang diperlukan.

```sh
npm install

# atau menggunakan pnpm
pnpm install
```
