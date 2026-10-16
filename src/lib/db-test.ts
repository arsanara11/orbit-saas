import { prisma } from "./prisma";

async function main() {
  await prisma.$connect();

  const result = await prisma.user.count();

  console.log("Koneksi database berhasil!");
  console.log("Jumlah user:", result);
}

main()
  .catch((error) => {
    console.error("Koneksi database gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
