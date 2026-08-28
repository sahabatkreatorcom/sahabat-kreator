export interface UserFriendlyError {
  message: string;
  suggestion: string;
  category: "auth" | "media" | "content" | "rate_limit" | "platform" | "network" | "unknown";
}

const ERROR_PATTERNS: Array<{
  pattern: RegExp | string[];
  result: UserFriendlyError;
}> = [
  // ============= AUTENTIKASI =============
  {
    pattern: [
      "token expired",
      "invalid token",
      "access_token",
      "OAuthException",
      "Invalid OAuth",
      "authorization required",
      "not authorized",
      "session expired",
      "invalid_grant",
      "token_expired",
      "401",
      "unauthorized",
      "invalid authentication credentials",
      "authentication credential",
      "token refresh failed",
      "please reconnect your account",
    ],
    result: {
      message: "Koneksi akun Anda telah kedaluwarsa",
      suggestion: "Hubungkan kembali akun media sosial Anda di Pengaturan → Akun",
      category: "auth",
    },
  },
  {
    pattern: [
      "permission denied",
      "insufficient permissions",
      "missing scope",
      "requires permission",
    ],
    result: {
      message: "Izin tidak mencukupi untuk tindakan ini",
      suggestion: "Hubungkan kembali akun Anda dan setujui semua izin yang diminta",
      category: "auth",
    },
  },
  {
    pattern: ["authorization error"],
    result: {
      message: "Instagram menolak permintaan publikasi ini",
      suggestion: "Periksa peran akun Instagram dan izin publikasi aplikasi Meta, lalu coba lagi",
      category: "platform",
    },
  },

  // ============= MEDIA =============
  {
    pattern: ["video too long", "duration exceeds", "max duration", "exceeds maximum duration"],
    result: {
      message: "Video Anda terlalu panjang untuk platform ini",
      suggestion: "Potong video agar sesuai dengan batas durasi platform",
      category: "media",
    },
  },
  {
    pattern: ["video too short", "minimum duration", "too short"],
    result: {
      message: "Video Anda terlalu pendek",
      suggestion: "Video perlu sedikit lebih panjang untuk platform ini",
      category: "media",
    },
  },
  {
    pattern: ["file too large", "exceeds size limit", "file size", "too large", "max size"],
    result: {
      message: "File Anda terlalu besar untuk diunggah",
      suggestion: "Kompres atau ubah ukuran media Anda sebelum memposting",
      category: "media",
    },
  },
  {
    pattern: [
      "unsupported format",
      "invalid format",
      "format not supported",
      "invalid media",
      "unsupported media type",
    ],
    result: {
      message: "Format file ini tidak didukung",
      suggestion: "Konversi ke format yang didukung (JPG, PNG untuk gambar; MP4 untuk video)",
      category: "media",
    },
  },
  {
    pattern: ["aspect ratio", "invalid dimensions", "wrong size", "image dimensions"],
    result: {
      message: "Dimensi gambar tidak memenuhi persyaratan",
      suggestion: "Ubah ukuran gambar agar sesuai dengan persyaratan rasio aspek platform",
      category: "media",
    },
  },
  {
    pattern: ["upload failed", "failed to upload", "upload error", "could not upload"],
    result: {
      message: "Unggahan media gagal",
      suggestion: "Coba unggah lagi, atau periksa apakah file Anda rusak",
      category: "media",
    },
  },
  {
    pattern: ["media not ready", "processing", "still processing", "container in progress"],
    result: {
      message: "Media masih sedang diproses",
      suggestion: "Tunggu sebentar dan coba publikasikan lagi",
      category: "media",
    },
  },

  // ============= KONTEN =============
  {
    pattern: ["caption too long", "text too long", "character limit", "exceeds character"],
    result: {
      message: "Caption Anda terlalu panjang",
      suggestion: "Perpendek caption agar sesuai dengan batas platform",
      category: "content",
    },
  },
  {
    pattern: ["blocked hashtag", "banned hashtag", "restricted hashtag", "prohibited hashtag"],
    result: {
      message: "Postingan Anda mengandung hashtag yang diblokir",
      suggestion: "Hapus atau ganti hashtag yang ditandai",
      category: "content",
    },
  },
  {
    pattern: ["spam", "looks like spam", "flagged as spam", "spam detection"],
    result: {
      message: "Postingan ditandai sebagai potensi spam",
      suggestion: "Buat konten yang bervariasi dan hindari memposting terlalu sering",
      category: "content",
    },
  },
  {
    pattern: ["community guidelines", "policy violation", "violates guidelines", "content policy"],
    result: {
      message: "Konten mungkin melanggar pedoman platform",
      suggestion: "Tinjau dan sesuaikan konten Anda agar memenuhi kebijakan platform",
      category: "content",
    },
  },
  {
    pattern: ["duplicate content", "already posted", "duplicate post", "identical content"],
    result: {
      message: "Konten ini sudah dipublikasikan",
      suggestion: "Buat postingan yang unik atau tunggu sebelum memposting konten serupa",
      category: "content",
    },
  },

  // ============= BATASAN =============
  {
    pattern: ["rate limit", "too many requests", "throttled", "slow down", "429", "quota exceeded"],
    result: {
      message: "Terlalu banyak permintaan",
      suggestion: "Tunggu beberapa menit sebelum mencoba lagi",
      category: "rate_limit",
    },
  },
  {
    pattern: ["daily limit", "reached limit", "posting limit", "maximum posts"],
    result: {
      message: "Anda telah mencapai batas postingan harian",
      suggestion: "Tunggu hingga besok untuk memposting lebih banyak konten",
      category: "rate_limit",
    },
  },

  // ============= PLATFORM =============
  {
    pattern: ["account suspended", "account disabled", "account banned", "account restricted"],
    result: {
      message: "Akun ini dibatasi atau ditangguhkan",
      suggestion: "Periksa status akun platform Anda secara langsung",
      category: "platform",
    },
  },
  {
    pattern: ["page not found", "user not found", "account not found", "profile not found"],
    result: {
      message: "Akun tidak dapat diakses lagi",
      suggestion: "Verifikasi akun Anda masih ada dan hubungkan kembali",
      category: "platform",
    },
  },
  {
    pattern: [
      "unavailable",
      "service unavailable",
      "temporarily unavailable",
      "503",
      "maintenance",
    ],
    result: {
      message: "Platform sedang tidak tersedia sementara",
      suggestion: "Platform sedang mengalami masalah - coba lagi dalam beberapa menit",
      category: "platform",
    },
  },
  {
    pattern: ["internal error", "500", "server error", "internal server"],
    result: {
      message: "Platform mengalami kesalahan",
      suggestion: "Ini adalah masalah sementara - coba publikasikan lagi sebentar lagi",
      category: "platform",
    },
  },
  {
    pattern: ["unaudited_client", "unaudited client", "private_accounts", "private accounts"],
    result: {
      message: "TikTok mengharuskan akun Anda diatur ke privat",
      suggestion:
        "Buka aplikasi TikTok → Pengaturan → Privasi → atur akun Anda ke Privat, lalu coba lagi",
      category: "platform",
    },
  },
  {
    pattern: ["board not found", "invalid board", "board does not exist"],
    result: {
      message: "Papan Pinterest yang dipilih tidak ditemukan",
      suggestion: "Pilih papan lain atau buat yang baru",
      category: "platform",
    },
  },
  {
    pattern: ["trial access", "api sandbox", "api-sandbox.pinterest.com"],
    result: {
      message: "Aplikasi Pinterest memerlukan persetujuan akses Standar",
      suggestion:
        "Ajukan permohonan akses Standar di Portal Pengembang Pinterest untuk mempublikasikan pin secara langsung",
      category: "auth",
    },
  },

  // ============= JARINGAN =============
  {
    pattern: ["timeout", "timed out", "connection timeout", "request timeout"],
    result: {
      message: "Koneksi habis waktu",
      suggestion: "Periksa koneksi internet Anda dan coba lagi",
      category: "network",
    },
  },
  {
    pattern: ["network error", "connection failed", "connection refused", "ECONNREFUSED"],
    result: {
      message: "Masalah koneksi jaringan",
      suggestion: "Periksa koneksi internet Anda dan coba lagi",
      category: "network",
    },
  },
];

export function getUserFriendlyError(rawError: string | Error | unknown): UserFriendlyError {
  let errorText = "";

  if (typeof rawError === "string") {
    errorText = rawError;
  } else if (rawError instanceof Error) {
    errorText = rawError.message;
  } else if (rawError && typeof rawError === "object") {
    const obj = rawError as Record<string, unknown>;
    errorText = String(
      obj.message ||
        obj.error ||
        obj.error_message ||
        obj.error_description ||
        obj.details ||
        JSON.stringify(obj),
    );
  }

  const lowerError = errorText.toLowerCase();

  for (const { pattern, result } of ERROR_PATTERNS) {
    if (Array.isArray(pattern)) {
      if (pattern.some((p) => lowerError.includes(p.toLowerCase()))) {
        return result;
      }
    } else {
      if (pattern.test(lowerError)) {
        return result;
      }
    }
  }

  return {
    message: "Terjadi kesalahan saat memproses",
    suggestion: "Coba lagi, atau hubungi dukungan jika masalah berlanjut",
    category: "unknown",
  };
}

export function getNotificationErrorSummary(rawError: string | Error | unknown): string {
  const friendly = getUserFriendlyError(rawError);
  return `${friendly.message}. ${friendly.suggestion}`;
}
