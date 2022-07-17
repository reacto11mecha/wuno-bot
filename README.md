<p align="center">
    <h2 align="center">WUNO (Whatsapp UNO) Bot</h2>
    <span><p align="center">Bot whatsapp yang berguna untuk bermain UNO.</p></span>
</p>

> Project ini terinspirasi dari [Exium1/UnoBot](https://github.com/Exium1/UnoBot) dan [mjsalerno/UnoBot](https://github.com/mjsalerno/UnoBot) yang beberapa asset dan logika pemrograman juga terdapat dalam project ini.

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
- Handphone tak terpakai (opsional)

## Pemakaian

### Ikhtisar Daftar Perintah

Berikut daftar perintah yang sudah dibuat.

// TODO: Buat daftar perintah dari penjelasan yang sudah dijelaskan di message

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

### Menjalankan Bot

Pertama-tama, copy file `env.example` menjadi `.env` dan isikan value yang sesuai.

Keterangan `.env`:

- `MONGO_URI`: URL Database MongoDB yang akan dijadikan penyimpanan data (WAJIB)
- `PREFIX`: Prefix bot agar bisa dipanggil dan digunakan, default `U#` (TIDAK WAJIB)

Sebelum menjalankan, terlebih dahulu mem-build kode typescript supaya bisa dijalankan di production mode.

```sh
npm run build

# atau menggunakan pnpm
pnpm build
```

Selesai mem-build bot, **jangan lupa menjalankan MongoDB**. Jika sudah berjalan baru bisa menggunakam bot dengan mengetikkan

```sh
npm start

# atau menggunakan pnpm
pnpm start
```

Jika baru pertama kali menjalankan, scan barcode di terminal untuk dihubungkan ke whatsapp di handphone.

### Lisensi

Semua kode yang ada di repositori ini bernaung dibawah [MIT License](LICENSE).
