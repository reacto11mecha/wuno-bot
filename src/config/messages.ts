import fs from "fs";
import path from "path";

import { env } from "../env";

const packageInfo = JSON.parse(
  fs.readFileSync(path.resolve("package.json"), "utf-8")
);

/**
 * Main github repository for this project
 */
export const GITHUB_URL: string = packageInfo.repository.url
  .replace("git+", "")
  .replace(".git", "");

/**
 * Greeting template for all help message
 */
export const greeting = `Halo, saya bot untuk bermain uno.
Prefix: \`\`\`${env.PREFIX}\`\`\``;

/**
 * Footer template for all help message
 */
export const footer = `Sumber Kode: ${GITHUB_URL}

Dibuat oleh ${packageInfo.author} di bawah lisensi MIT.`;

/**
 * General information about this bot
 */
export const botInfo = `${greeting}

Untuk perintah lengkap ketik:
\`\`\`${env.PREFIX}help\`\`\`

${footer}`;

/**
 * Function for generate dynamic of all available commands name and serve other information
 * @param commands All valid commands available
 * @returns Help message string template
 */
export const helpTemplate = (commands: string[]) => `${greeting}

*Daftar Perintah*
============
${commands
  .sort((a, b) => a.localeCompare(b))
  .map(
    (command, idx) =>
      `- ${`\`\`\`${command}\`\`\``}${idx !== commands.length - 1 ? "\n" : ""}`
  )
  .join("")}

*Disclaimer*
=========
Bot ini menyimpan data *nomor telepon* serta *username* kamu untuk keperluan mekanisme permainan.

Sebelum kamu bermain kamu telah *mengetahui* serta *menyetujui* bahwa kamu *mengizinkan* datamu untuk disimpan.

Jika ingin *menghapus* data, silahkan *hubungi operator bot* yang bertanggung jawab.

*Ikhtisar*
======
Bot ini adalah bot yang digunakan untuk bermain uno di whatsapp. Cara kerjanya dengan mengirimkan perintah lewat DM pribadi ke bot ini, tapi masih bisa digunakan di grup semisal untuk membuat permainan.

Untuk membuat permainan caranya dengan menjalankan 

\`\`\`${env.PREFIX}creategame\`\`\` (atau \`\`\`${env.PREFIX}cg\`\`\`) 

dan akan membuat kode yang bisa diteruskan ke orang lain.

Orang yang diberikan meneruskan kembali kode itu ke bot dan akan masuk ke sesi permainan sesuai dengan kode yang sudah diberikan sebelumnya.

Setelah dirasa sudah cukup orang, permainan bisa dimulai menggunakan 

\`\`\`${env.PREFIX}startgame\`\`\` (atau \`\`\`${env.PREFIX}sg\`\`\`)

kartu akan diberikan dan permainan dimulai.


Untuk bermain, gunakan 

\`\`\`${env.PREFIX}play <kartu kamu>\`\`\`
(atau \`\`\`${env.PREFIX}p <kartu kamu>\`\`\`) 

untuk menaruh kartu yang sesuai dengan apa yang ada di deck. 

Jika valid, kartu akan ditaruh dan giliran bermain akan beralih ke pemain selanjutnya.


Jika kamu tidak memiliki kartu ambilah kartu baru dengan menggunakan 

\`\`\`${env.PREFIX}draw\`\`\` (atau \`\`\`${env.PREFIX}d\`\`\`) 

maka kartu baru akan diambil dan giliran bermain akan beralih ke pemain selanjutnya.

Untuk berkomunikasi dengan pemain lain di game, gunakan 

\`\`\`${env.PREFIX}say <pesan mu>\`\`\`


Untuk melihat lebih jelas apa maksud dari perintah, gunakan

\`\`\`${env.PREFIX}help <nama lengkap perintah>\`\`\`


${footer}`;

/**
 * Function for generate specific command can do
 * @param command Command name
 * @param explanation Explanation about what the command will do
 * @param alias List of all command alias available
 * @param messageExample Example of the command if triggered
 * @param param Parameter explanation (optional)
 * @returns  Template string for replying specific command
 */
const replyBuilder = (
  command: string,
  explanation: string,
  alias: string[],
  messageExample: string,
  param?: string
) => `${greeting}

  ${command.charAt(0).toUpperCase() + command.slice(1)}
  ${Array.from(new Array(command.length))
    .map(() => "=")
    .join("")}
  ${explanation}
  
  Contoh penggunaan:
  \`\`\`${env.PREFIX}${command}${param ? ` ${param}` : ""}\`\`\`

  Alias: ${alias.map((a) => `\`\`\`${a}\`\`\``).join(", ")}

  Contoh balasan:
  ${messageExample}

${footer}`;

/**
 * All replies string collection for help message
 */
export const replies = {
  ban: replyBuilder(
    "ban",
    "Perintah ini digunakan untuk menge-ban seseorang, semisal ada orang yang tidak dikenali masuk ke permainan.",
    ["b"],
    '"Berhasil menge-ban E. Sekarang dia tidak ada dalam permainan."',
    "<nama yang ingin di ban>"
  ),

  cards: replyBuilder(
    "cards",
    "Perintah ini digunakan untuk mengecek kartu yang ada pada saat kamu bermain.",
    ["c"],
    '"Kartu kamu: greenskip, yellow4, red6, blue1"'
  ),

  creategame: replyBuilder(
    "creategame",
    `Perintah ini digunakan untuk membuat permainan baru. 

  Setelah kode berhasil dibuat, bot akan mengirimkan kode yang bisa diteruskan ke pemain lain agar bisa bergabung ke dalam permainan.`,
    ["cg", "create"],
    `"Game berhasil dibuat.
    
  Ajak teman kamu untuk bermain..."`
  ),

  draw: replyBuilder(
    "draw",
    `Perintah ini digunakan untuk mengambil kartu baru pada saat giliranmu.
  
  Terkadang kamu tidak memiliki kartu yang pas pada saat bermain, perintah ini bertujuan untuk mengambil kartu baru.`,
    ["d", "pickup", "newcard"],
    '"Berhasil mengambil kartu baru, *red6*. Selanjutnya adalah giliran A untuk bermain"'
  ),

  endgame: replyBuilder(
    "endgame",
    `Perintah ini digunakan untuk menghentikan permainan yang belum/sedang berjalan.
    
  Perintah ini hanya bisa digunakan oleh orang yang membuat permainan.`,
    ["eg", "end"],
    '"A telah menghentikan permainan. Terimakasih sudah bermain!"'
  ),

  infogame: replyBuilder(
    "infogame",
    `Perintah ini digunakan untuk mengetahui informasi dari sebuah permainan.
    
  Jika kamu sudah memasuki sebuah permainan, tidak perlu memasukan id game, tetapi kalau belum diperlukan id game tersebut.`,
    ["i", "ig", "info"],
    '"Game ID: XXXXXX..."',
    "<id game>"
  ),

  joingame: replyBuilder(
    "joingame",
    `Perintah ini digunakan untuk masuk ke sebuah permainan.
    
  Diperlukan id dari game yang sudah dibuat, biasanya tidak perlu mengetikkan lagi karena sudah diberikan oleh pembuat gamenya langsung.`,
    ["j", "jg", "join"],
    '"Berhasil join ke game "XXXX", tunggu pembuat ruang game ini memulai permainannya!"',
    "<id game>"
  ),

  kick: replyBuilder(
    "kick",
    "Perintah ini digunakan untuk kick seseorang, semisal ada teman yang AFK pada saat permainan.",
    ["k"],
    '"Berhasil mengkick E. Sekarang dia tidak ada dalam permainan."',
    "<nama yang ingin di kick>"
  ),

  leavegame: replyBuilder(
    "leavegame",
    `Perintah ini digunakan untuk keluar dari sebuah permainan.
    
  Perintah ini bisa digunakan pada saat permainan atau saat menunggu.`,
    ["l", "lg", "quit", "leave", "leavegame"],
    '"Anda berhasil keluar dari game. Terimakasih telah bermain!"'
  ),

  play: replyBuilder(
    "play",
    `Perintah ini digunakan untuk mengeluarkan kartu dalam sebuah permainan.
    
Jika kartu cocok akan ditaruh ke deck dan pemain selanjutnya akan mendapatkan giliran.`,
    ["p"],
    '"Berhasil mengeluarkan kartu *red9*, selanjutnya adalah giliran B untuk bermain"',
    "<kartu>"
  ),

  say: replyBuilder(
    "say",
    `Perintah ini digunakan untuk mengatakan sesuatu dalam sebuah permainan.
    
  Isi pesan sesuai yang kamu inginkan, tapi perlu di ingat, bercakaplah dengan bahasa yang sopan.`,
    ["s"],
    '"USERNAME: pesan disini"',
    "<pesan>"
  ),

  startgame: replyBuilder(
    "startgame",
    `Perintah ini digunakan untuk memulai permainan yang belum berjalan.
    
    Perintah ini hanya bisa digunakan oleh orang yang membuat permainan.`,
    ["sg", "start"],
    '"Game berhasil dimulai! Sekarang giliran C untuk bermain"'
  ),
};
