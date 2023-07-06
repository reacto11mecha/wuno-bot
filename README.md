<p align="center">
    <h2 align="center">WUNO (Whatsapp UNO) Bot</h2>
    <span><p align="center">Bot whatsapp yang berguna untuk bermain UNO.</p></span>
</p>

[![ES Lint & Typing test](https://github.com/reacto11mecha/wuno-bot/actions/workflows/lint-typing.yml/badge.svg)](https://github.com/reacto11mecha/wuno-bot/actions/workflows/lint-typing.yml) [![Unit test](https://github.com/reacto11mecha/wuno-bot/actions/workflows/unit-test.yml/badge.svg)](https://github.com/reacto11mecha/wuno-bot/actions/workflows/unit-test.yml)

> Project ini terinspirasi dari [Exium1/UnoBot](https://github.com/Exium1/UnoBot) dan [mjsalerno/UnoBot](https://github.com/mjsalerno/UnoBot) yang beberapa asset dan logika pemrograman juga terdapat dalam project ini.

Bot ini adalah bot whatsapp yang memungkinkan pengguna untuk bermain UNO langsung di whatsapp. Dengan menjapri bot, mengirimkan kode permainan ke teman anda, dan memulai permainan kamu bisa bermain UNO seperti kamu bermain dengan teman langsung.

## Sebelum Menggunakan

Bot ini menyimpan data **nomor telepon** serta **username** pemain untuk keperluan mekanisme permainan.

Jika kamu adalah orang yang menjalankan bot ini, kamu **wajib** bertanggung jawab atas data-data pemain yang tersimpan. **Jangan** melimpahkan data pribadi ke pihak yang tidak bertanggung jawab. Jika mereka ingin menghapus data pribadi mereka, kamu **wajib** menghapusnya.

Jika kamu adalah pemain, kamu berarti telah **mengetahui** serta **menyetujui** bahwa kamu **mengizinkan** datamu untuk disimpan ke bot lawan bicara. Jika ingin **menghapus** data, silahkan **hubungi operator bot** yang bertanggung jawab.

### Pesan untuk Administrator

Untuk menghindari kejadian yang tidak diinginkan, lebih baik menggunakan Database MySQL yang di host secara local. Kemudian, disarankan untuk tidak menghosting bot secara 24 jam, host bot secara local memang pada saat dibutuhkan.

### Pesan untuk Pemain

Pilihlah bot dengan administrator yang bertanggung jawab dan dapat dipercaya. Lebih dari itu, pilihlah administrator yang mengerti dan teman dekatmu.

## Prerequisites

Anda butuh

- Node.js LTS dan NPM (atau Package Manager lainnya)
- Database MySQL atau MariaDB
- Akun whatsapp tak terpakai
- Google chrome

## Pemakaian

### Penjelasan Awal

Bot ini adalah bot yang digunakan untuk bermain uno di whatsapp. Cara kerjanya dengan mengirimkan perintah lewat DM pribadi ke bot ini, tapi juga bisa digunakan di grup namun terbatas untuk membuat dan bergabung dalam permainan.

Untuk membuat permainan caranya dengan menjalankan `U#creategame` (atau `U#cg`) dan akan membuat kode yang bisa diteruskan ke orang lain.

Orang yang diberikan meneruskan kembali kode itu ke bot dan akan masuk ke sesi permainan sesuai dengan kode yang sudah diberikan sebelumnya.

Setelah dirasa sudah cukup orang, permainan bisa dimulai menggunakan `U#startgame` (atau `U#sg`) kartu akan diberikan dan permainan dimulai.

Untuk bermain, gunakan `U#play <kartu kamu>`
(atau `U#p <kartu kamu>`) untuk menaruh kartu yang sesuai dengan apa yang ada di deck. Jika valid, kartu akan ditaruh dan giliran bermain akan beralih ke pemain selanjutnya.

Jika kamu tidak memiliki kartu ambilah kartu baru dengan menggunakan `U#draw` (atau `U#d`) maka kartu baru akan diambil dan giliran bermain akan beralih ke pemain selanjutnya.

Untuk berkomunikasi dengan pemain lain di game, gunakan `U#say <pesan mu>`.

Untuk melihat lebih jelas apa maksud dari perintah, gunakan `U#help <nama lengkap perintah>`.

### Daftar Perintah

Berikut daftar perintah yang sudah dibuat. Jika konfigurasi prefix diubah maka prefix akan mengikuti konfigurasi yang sudah ada.

- `ban`

  Perintah ini digunakan untuk menge-ban seseorang, semisal ada orang yang tidak dikenali masuk ke permainan.

  Contoh penggunaan:

  _`U# ban <nama yang ingin di ban>`_

  Alias: _`b`_

  Contoh balasan:

  ```
  Berhasil menge-ban E. Sekarang dia tidak ada dalam permainan.
  ```

- `cards`

  Perintah ini digunakan untuk mengecek kartu yang ada pada saat kamu bermain.

  Contoh penggunaan:

  _`U# cards`_

  Alias: _`c`_

  Contoh balasan:

  ```
  Kartu kamu: greenskip, yellow4, red6, blue1
  ```

- `creategame`

  Perintah ini digunakan untuk membuat permainan baru.

  Setelah kode berhasil dibuat, bot akan mengirimkan kode yang bisa diteruskan ke pemain lain agar bisa bergabung ke dalam permainan.

  Contoh penggunaan:

  `U# creategame`

  Alias: _`cg`_, _`create`_

  Contoh balasan:

  ```
  Game berhasil dibuat.

  Ajak teman kamu untuk bermain...
  ```

- `draw`

  Perintah ini digunakan untuk mengambil kartu baru pada saat giliranmu.

  Terkadang kamu tidak memiliki kartu yang pas pada saat bermain, perintah ini bertujuan untuk mengambil kartu baru. ke dalam permainan.

  Contoh penggunaan:

  _`U# draw`_

  Alias: _`d`_, _`pickup`_, _`newcard`_

  Contoh balasan:

  ```
  Berhasil mengambil kartu baru, red6. Selanjutnya adalah giliran A untuk bermain
  ```

- `endgame`

  Perintah ini digunakan untuk menghentikan permainan yang belum/sedang berjalan.

  Perintah ini hanya bisa digunakan oleh orang yang membuat permainan.

  Contoh penggunaan:

  _`U# endgame`_

  Alias: _`eg`_, _`end`_

  Contoh balasan:

  ```
  A telah menghentikan permainan. Terimakasih sudah bermain!
  ```

- `infogame`

  Perintah ini digunakan untuk mengetahui informasi dari sebuah permainan.

  Jika kamu sudah memasuki sebuah permainan, tidak perlu memasukan id game, tetapi kalau belum diperlukan id game tersebut.

  Contoh penggunaan:

  _`U# infogame <id game>`_

  Alias: _`i`_, _`ig`_, _`info`_

  Contoh balasan:

  ```
  A telah menghentikan permainan. Terimakasih sudah bermain!
  ```

- `joingame`

  Perintah ini digunakan untuk masuk ke sebuah permainan.

  Diperlukan id dari game yang sudah dibuat, biasanya tidak perlu mengetikkan lagi karena sudah diberikan oleh pembuat gamenya langsung.

  Contoh penggunaan:

  _`U# joingame <id game>`_

  Alias: _`j`_, _`jg`_, _`join`_

  Contoh balasan:

  ```
  Berhasil join ke game "XXXX", tunggu pembuat ruang game ini memulai permainannya!
  ```

- `kick`

  Perintah ini digunakan untuk kick seseorang, semisal ada teman yang AFK pada saat permainan.

  Contoh penggunaan:

  _`U# kick <nama yang ingin di kick>`_

  Alias: _`k`_

  Contoh balasan:

  ```
  Berhasil mengkick E. Sekarang dia tidak ada dalam permainan.
  ```

- `leaderboard`

  Perintah ini digunakan untuk mengetahui siapa saja terampil dalam bermain.

  Akan terdapat list nama pemain, berapa permainan yang dimainkan, dan rata-rata permainan.

  Contoh penggunaan:

  _`U# leaderboard`_

  Alias: _`board`_, _`lb`_

  Contoh balasan:
  Papan peringkat pemain saat ini

- `leavegame`

  Perintah ini digunakan untuk keluar dari sebuah permainan.

  Perintah ini bisa digunakan pada saat permainan atau saat menunggu.

  Contoh penggunaan:

  _`U# leavegame`_

  Alias: _`l`_, _`lg`_, _`quit`_, _`leave`_, _`leavegame`_

  Contoh balasan:

  ```
  Anda berhasil keluar dari game. Terimakasih telah bermain!
  ```

- `play`

  Perintah ini digunakan untuk mengeluarkan kartu dalam sebuah permainan.

  Jika kartu cocok akan ditaruh ke deck dan pemain selanjutnya akan mendapatkan giliran.

  Contoh penggunaan:

  _`U# play <kartu>`_

  Alias: _`p`_

  Contoh balasan:

  ```
  Berhasil mengeluarkan kartu *red9*, selanjutnya adalah giliran B untuk bermain
  ```

- `say`

  Perintah ini digunakan untuk mengatakan sesuatu dalam sebuah permainan.

  Kamu bisa mengirim gambar, gif, dan sticker dengan caption juga. Untuk mengirim gambar dan sticker kamu bisa mengisi caption dan diisikan perintah yang sesuai. Jika ingin mengirimkan sticker maka kamu harus mengirimkan sticker terlebih dahulu, lalu balas sticker dengan mengisikan caption. Kamu juga bisa melakukan teknik balas pada gambar maupun gif. Selain itu, kamu bisa mengirimkan text biasa.

  Contoh penggunaan:

  _`U# say <pesan (wajib jika hanya mengirimkan text)>`_

  Alias: _`s`_

  Contoh balasan:

  ```
  USERNAME: pesan disini
  ```

- `startgame`

  Perintah ini digunakan untuk memulai permainan yang belum berjalan.

  Perintah ini hanya bisa digunakan oleh orang yang membuat permainan.

  Contoh penggunaan:

  _`U# startgame`_

  Alias: _`sg`_, _`start`_

  Contoh balasan:

  ```
  Game berhasil dimulai! Sekarang giliran C untuk bermain
  ```

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

### Mengenerate dan push schema ke database

Karena menggunakan database yang SQL-Based dan prisma, diperlukan untuk mengenerate dan push schema ke database. Di bawah ini adalah perintah-perintah yang harus dilaksanakan.

Generate schema prisma:

```sh
npm run db:generate

# atau menggunakan pnpm
pnpm db:generate
```

Push schema prisma ke database:

```sh
npm run db:push

# atau menggunakan pnpm
pnpm db:push
```

### Menjalankan Bot

Pertama-tama, copy file `env.example` menjadi `.env` dan isikan value yang sesuai.

Keterangan `.env`:

- `DATABASE_URL`: URL Database MySQL yang akan dijadikan penyimpanan data (**WAJIB**)
- `CHROME_PATH`: Path ke executable google chrome yang terinstall (**WAJIB**)
- `PREFIX`: Prefix bot agar bisa dipanggil dan digunakan, default `U#` (Opsional)

> Di perlukan google chrome supaya bisa menerima dan mengirim gif, sticker, dan gambar secara konsisten. Penjelasan lebih lanjut, cek dokumentasi [wwebjs](https://wwebjs.dev/guide/handling-attachments.html#caveat-for-sending-videos-and-gifs).

Sebelum menjalankan, terlebih dahulu mem-build kode typescript supaya bisa dijalankan di production mode.

```sh
npm run build

# atau menggunakan pnpm
pnpm build
```

Selesai mem-build bot, **jangan lupa menjalankan database MySQL/MariaDB**. Jika sudah berjalan baru bisa menggunakan bot dengan mengetikkan

```sh
npm start

# atau menggunakan pnpm
pnpm start
```

Jika baru pertama kali menjalankan, scan barcode di terminal untuk dihubungkan ke whatsapp di handphone.

Jika ingin dijalankan seperti mode production menggunakan `pm2` bisa menjalankan perintah di bawah ini, jangan lupa autentikasi terlebih dahulu mengikuti langkah di atas karena lebih mudah. Jangan lupa untuk menginstall `pm2` secara global.

```sh
pm2 start ecosystem.config.js
```

### Lisensi

Semua kode yang ada di repositori ini bernaung dibawah [MIT License](LICENSE).
