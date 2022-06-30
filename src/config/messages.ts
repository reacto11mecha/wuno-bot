import fs from "fs";
import path from "path";

const packageInfo = JSON.parse(
  fs.readFileSync(path.resolve("package.json"), "utf-8")
);
const PREFIX = process.env.PREFIX || "U#";

export const GITHUB_URL = packageInfo.repository.url
  .replace("git+", "")
  .replace(".git", "");
export const greeting = `Halo, saya bot untuk bermain uno.
Prefix: ${PREFIX}`;
export const footer = `Sumber Kode: ${GITHUB_URL}

Dibuat oleh ${packageInfo.author} di bawah lisensi MIT.`;

export const botInfo = `${greeting}

Untuk perintah lengkap ketik:
"${PREFIX} help" (tanpa tanda ").

${footer}`;

export const helpTemplate = (commands: string[]) => `${greeting}

*Daftar Perintah*
============
${commands
  .sort((a, b) => a.localeCompare(b))
  .map(
    (command, idx) => `- ${command}${idx !== commands.length - 1 ? "\n" : ""}`
  )
  .join("")}

*Ikhtisar*
======
Bot ini adalah bot yang digunakan untuk bermain uno di whatsapp. Cara kerjanya dengan mengirimkan perintah lewat DM pribadi ke bot ini, tapi masih bisa digunakan di grup semisal untuk membuat permainan.

Untuk membuat permainan caranya dengan menjalankan "${PREFIX}creategame" (atau "${PREFIX}cg") dan akan membuat kode yang bisa diteruskan ke orang lain.

Orang yang diberikan meneruskan kembali kode itu ke bot dan akan masuk ke sesi permainan sesuai dengan kode yang sudah diberikan sebelumnya.

Setelah dirasa sudah cukup orang, permainan bisa dimulai menggunakan "${PREFIX}startgame" (atau "${PREFIX}sg"), kartu akan diberikan dan permainan dimulai.


Untuk bermain, gunakan "${PREFIX}play <kartu yang kamu miliki>" (atau "${PREFIX}p <kartu yang kamu miliki>") untuk menaruh kartu yang sesuai dengan apa yang ada di deck. 

Jika valid, kartu akan ditaruh dan giliran bermain akan beralih ke pemain selanjutnya.

Jika kamu tidak memiliki kartu ambilah kartu baru dengan menggunakan "${PREFIX}draw" (atau "${PREFIX}d"), maka kartu baru akan diambil dan giliran bermain akan beralih ke pemain selanjutnya.

Untuk berkomunikasi dengan pemain lain di game, gunakan "${PREFIX}say <pesan mu>".


Untuk melihat lebih jelas apa maksud dari perintah, gunakan
"${PREFIX}help <nama lengkap perintah>"


${footer}`;

export const replies = {
  cards: `${greeting}

  Cards

${footer}`,
};
