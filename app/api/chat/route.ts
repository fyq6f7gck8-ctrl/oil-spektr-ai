import { NextResponse } from "next/server";
import OpenAI from "openai";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

// =========================
// OPENROUTER
// =========================

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// =========================
// EXCEL
// =========================

function loadExcelData() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "inventory.xlsx"
  );

  const fileBuffer =
    fs.readFileSync(filePath);

  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
  });

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const rows =
    XLSX.utils.sheet_to_json(sheet, {
      header: 1,
    });

  return rows as any[];
}

// =========================
// MAIN
// =========================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message =
      body.message.toLowerCase();

    const rows = loadExcelData();

    // =========================
    // AI INTENT + FALLBACK
    // =========================

    let intent = "search";

    try {
      const ai =
        await openai.chat.completions.create({
          model:
            "meta-llama/llama-3.2-3b-instruct:free",

          messages: [
            {
              role: "system",
              content: `
Ты определяешь тип запроса.

Отвечай ТОЛЬКО одним словом:

air
oil
fuel
low
search
`,
            },
            {
              role: "user",
              content: message,
            },
          ],

          max_tokens: 5,
        });

      intent =
        ai.choices[0].message.content
          ?.trim()
          .toLowerCase() || "search";
    } catch (e) {
      console.log("AI fallback");

      // FALLBACK

      if (
        message.includes("заказать") ||
        message.includes("мало") ||
        message.includes("заканчивается") ||
        message.includes("остаток")
      ) {
        intent = "low";
      }

      else if (
        message.includes("воздуш")
      ) {
        intent = "air";
      }

      else if (
        message.includes("масля")
      ) {
        intent = "oil";
      }

      else if (
        message.includes("топлив")
      ) {
        intent = "fuel";
      }
    }

    // =========================
    // LOW STOCK
    // =========================

    if (intent.includes("low")) {
      const lowStock = rows.filter(
        (row: any) => {
          const qty = Number(row[4] || 0);

          return qty > 0 && qty <= 2;
        }
      );

      if (!lowStock.length) {
        return NextResponse.json({
          answer:
            "Товаров с маленьким остатком нет",
        });
      }

      const answer =
        "Нужно дозаказать:\n\n" +
        lowStock
          .slice(0, 30)
          .map((row: any) => {
            return `${row[1]} — ${row[4]} шт`;
          })
          .join("\n");

      return NextResponse.json({
        answer,
      });
    }

    // =========================
    // AIR
    // =========================

    if (intent.includes("air")) {
      const airFilters = rows.filter(
        (row: any) => {
          const article = String(
            row[1] || ""
          ).toLowerCase();

          return article.startsWith("a-");
        }
      );

      const totalQty = airFilters.reduce(
        (sum: number, row: any) => {
          return sum + Number(row[4] || 0);
        },
        0
      );

      const answer =
        `Воздушных фильтров: ${totalQty} шт\n\n` +
        airFilters
          .slice(0, 20)
          .map((row: any) => {
            return `${row[1]} — ${row[4] || 0} шт`;
          })
          .join("\n");

      return NextResponse.json({
        answer,
      });
    }

    // =========================
    // OIL
    // =========================

    if (intent.includes("oil")) {
      const oilFilters = rows.filter(
        (row: any) => {
          const article = String(
            row[1] || ""
          ).toLowerCase();

          return article.startsWith("c-");
        }
      );

      const totalQty = oilFilters.reduce(
        (sum: number, row: any) => {
          return sum + Number(row[4] || 0);
        },
        0
      );

      const answer =
        `Масляных фильтров: ${totalQty} шт\n\n` +
        oilFilters
          .slice(0, 20)
          .map((row: any) => {
            return `${row[1]} — ${row[4] || 0} шт`;
          })
          .join("\n");

      return NextResponse.json({
        answer,
      });
    }

    // =========================
    // FUEL
    // =========================

    if (intent.includes("fuel")) {
      const fuelFilters = rows.filter(
        (row: any) => {
          const article = String(
            row[1] || ""
          ).toLowerCase();

          return article.startsWith("fc");
        }
      );

      const totalQty = fuelFilters.reduce(
        (sum: number, row: any) => {
          return sum + Number(row[4] || 0);
        },
        0
      );

      const answer =
        `Топливных фильтров: ${totalQty} шт\n\n` +
        fuelFilters
          .slice(0, 20)
          .map((row: any) => {
            return `${row[1]} — ${row[4] || 0} шт`;
          })
          .join("\n");

      return NextResponse.json({
        answer,
      });
    }

    // =========================
    // SEARCH
    // =========================

    const results = rows.filter(
      (row: any) => {
        const article = String(
          row[1] || ""
        ).toLowerCase();

        const brand = String(
          row[2] || ""
        ).toLowerCase();

        const text =
          `${article} ${brand}`;

        return message
          .split(" ")
          .some((word: string) => {
            return text.includes(word);
          });
      }
    );

    if (!results.length) {
      return NextResponse.json({
        answer: "Ничего не найдено",
      });
    }

    const answer = results
      .slice(0, 20)
      .map((row: any) => {
        return `${row[1]} — ${row[2] || "-"} — ${
          row[4] || 0
        } шт — ${row[3] || 0}₽`;
      })
      .join("\n");

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      answer: "Ошибка",
    });
  }
}