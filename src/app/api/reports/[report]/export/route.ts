import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getArrearsReport,
  getMonthlyRecap,
  getStaffSalaryReport,
  getYearlyBalanceReport,
} from "@/lib/services/reports";
import { exportReport } from "@/lib/services/report-export";

type ReportKey = "monthly-recap" | "arrears" | "staff-salary" | "yearly-balance";
type ExportFormat = "xlsx" | "pdf";

function isReportKey(value: string): value is ReportKey {
  return ["monthly-recap", "arrears", "staff-salary", "yearly-balance"].includes(value);
}

function isFormat(value: string | null): value is ExportFormat {
  return value === "xlsx" || value === "pdf";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ report: string }> },
) {
  try {
    const params = await context.params;
    if (!isReportKey(params.report)) {
      return NextResponse.json({ ok: false, message: "Unknown report" }, { status: 404 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (!isFormat(format)) {
      return NextResponse.json({ ok: false, message: "format must be xlsx or pdf" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    let payload:
      | {
          title: string;
          filenameBase: string;
          meta?: Record<string, string | number>;
          rows: Array<Record<string, string | number | boolean | null>>;
        }
      | null = null;

    if (params.report === "monthly-recap") {
      const data = await getMonthlyRecap(supabase, url.searchParams.get("month"));
      payload = {
        title: "Laporan Rekap Bulanan SiMas",
        filenameBase: `monthly-recap-${data.month}`,
        meta: {
          month: data.month,
          income_total: data.income.total,
          expense_total: data.expenses.total,
          ending_balance: data.endingBalance,
        },
        rows: data.expenses.byCategory.map((row) => ({
          category: row.category,
          amount: row.amount,
        })),
      };
    }

    if (params.report === "arrears") {
      const data = await getArrearsReport(supabase, url.searchParams.get("month"));
      payload = {
        title: "Laporan Tunggakan Warga SiMas",
        filenameBase: `arrears-${data.month}`,
        meta: { month: data.month, total_rows: data.rows.length },
        rows: data.rows.map((row) => ({
          code: row.code,
          display_name: row.displayName,
          arrears_balance: row.arrearsBalance,
          payment_status: row.paymentStatus,
        })),
      };
    }

    if (params.report === "staff-salary") {
      const data = await getStaffSalaryReport(
        supabase,
        url.searchParams.get("from"),
        url.searchParams.get("to"),
      );
      payload = {
        title: "Riwayat Gaji Petugas SiMas",
        filenameBase: `staff-salary-${data.period.from}-${data.period.to}`,
        meta: {
          from: data.period.from,
          to: data.period.to,
          satpam_total: data.totals.satpam,
          sampah_total: data.totals.sampah,
          total: data.totals.total,
        },
        rows: data.rows.map((row) => ({
          expense_date: row.expenseDate,
          category: row.category,
          amount: row.amount,
          note: row.note,
          created_by: row.createdBy,
        })),
      };
    }

    if (params.report === "yearly-balance") {
      const data = await getYearlyBalanceReport(supabase, url.searchParams.get("year"));
      payload = {
        title: "Neraca Tahunan SiMas",
        filenameBase: `yearly-balance-${data.year}`,
        meta: {
          year: data.year,
          income_total: data.income.total,
          expense_total: data.expense.total,
          net: data.net,
        },
        rows: [
          {
            year: data.year,
            dues_income: data.income.dues,
            incidental_income: data.income.incidental,
            total_income: data.income.total,
            total_expense: data.expense.total,
            net: data.net,
          },
        ],
      };
    }

    if (!payload) {
      return NextResponse.json({ ok: false, message: "Failed building report payload" }, { status: 500 });
    }

    const file = exportReport(payload, format);

    return new Response(file.body, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
