from __future__ import annotations

import math
import streamlit as st

st.set_page_config(page_title="Quick & Dirty Biz Evaluation Kit", page_icon=":material/query_stats:", layout="wide")

INDUSTRIES = ["Manufacturing", "Retail", "Software / SaaS", "Healthcare", "Financial Services", "Real Estate", "Energy / Utilities", "Consumer Services", "Other", "Early-stage / high growth"]
COLS = ("growth", "target_margin", "wacc", "terminal_growth", "multiple_low", "multiple_base", "multiple_high", "tax", "da", "capex", "nwc", "dcf_weight")

US_ROWS = [
    (.03,.14,.10,.02,5,7,9,.25,.035,.045,.010,.50), (.025,.08,.095,.02,4,6,8,.25,.025,.03,.015,.45),
    (.10,.25,.115,.03,9,13,17,.23,.02,.025,.005,.55), (.05,.18,.09,.025,7,10,13,.24,.03,.04,.01,.50),
    (.04,.22,.11,.025,6,8.5,11,.27,.01,.015,.005,.40), (.025,.30,.085,.015,8,11,14,.24,.04,.05,.005,.45),
    (.02,.25,.08,.015,6,8,10,.25,.05,.06,.005,.50), (.035,.12,.105,.02,5,7.5,10,.25,.025,.03,.01,.50),
    (.03,.15,.10,.02,5,7.5,10,.25,.03,.04,.01,.50), (.15,.05,.14,.03,6,10,14,.23,.02,.05,.02,.60),
]
IT_ROWS = [
    (.02,.12,.095,.015,4.5,6,7.5,.279,.035,.045,.012,.50), (.015,.065,.09,.015,3.5,5,6.5,.279,.025,.03,.015,.45),
    (.07,.20,.11,.02,7,10,13,.279,.02,.025,.006,.55), (.03,.16,.085,.018,6,8.5,11,.279,.03,.04,.01,.50),
    (.025,.20,.105,.015,4,6.5,9,.30,.01,.015,.005,.40), (.015,.28,.08,.01,7,9.5,12,.279,.04,.05,.005,.45),
    (.015,.22,.075,.01,5.5,7,8.5,.279,.05,.06,.005,.50), (.02,.10,.095,.015,4.5,6.5,8.5,.279,.025,.03,.012,.50),
    (.02,.13,.095,.015,4.5,6.5,8.5,.279,.03,.04,.012,.50), (.10,.03,.13,.02,4,7,10,.279,.02,.05,.02,.60),
]
ASSUMPTIONS = {
    "US Context": {name: dict(zip(COLS,row)) for name,row in zip(INDUSTRIES,US_ROWS)},
    "Italian Context": {name: dict(zip(COLS,row)) for name,row in zip(INDUSTRIES,IT_ROWS)},
}

def money(value: float, symbol: str) -> str:
    if not math.isfinite(value): return "—"
    sign = "−" if value < 0 else ""
    v = abs(value)
    if v >= 1_000_000_000: return f"{sign}{symbol}{v/1_000_000_000:,.2f}bn"
    if v >= 1_000_000: return f"{sign}{symbol}{v/1_000_000:,.2f}m"
    return f"{sign}{symbol}{v:,.0f}"

def rating(metric: str, value: float, target: float = 0) -> str:
    if metric == "EBITDA margin": return "Healthy" if value >= target else "Watch" if value >= .7*target else "Risk"
    if metric == "Net margin": return "Healthy" if value >= .10 else "Watch" if value >= .03 else "Risk"
    if metric == "Cost-to-income": return "Healthy" if value <= .70 else "Watch" if value <= .85 else "Risk"
    if metric == "Current ratio": return "Healthy" if value >= 1.5 else "Watch" if value >= 1 else "Risk"
    if metric == "Cash / debt": return "Healthy" if value >= .30 else "Watch" if value >= .10 else "Risk"
    if metric == "Gross debt / EBITDA": return "Healthy" if value <= 2.5 else "Watch" if value <= 4 else "Risk"
    if metric == "Net debt / EBITDA": return "Healthy" if value <= 2 else "Watch" if value <= 4 else "Risk"
    return "OK" if abs(value) <= .05 else "Check inputs"

def score_for(label: str) -> int:
    return {"Healthy":100,"OK":100,"Watch":60,"Risk":20,"Check inputs":40}.get(label,0)

def model(revenue, ebitda, net_income, opex, current_ratio, cash, debt, a):
    safe_rev = revenue if revenue else math.nan
    safe_ebitda = ebitda if ebitda else math.nan
    ratios = {
        "EBITDA margin": ebitda/safe_rev, "Net margin": net_income/safe_rev, "Cost-to-income": opex/safe_rev,
        "Current ratio": current_ratio, "Cash / debt": cash/debt if debt else math.inf,
        "Gross debt / EBITDA": debt/safe_ebitda, "Net debt / EBITDA": (debt-cash)/safe_ebitda,
        "Opex vs EBITDA check": (revenue-opex-ebitda)/safe_rev,
    }
    ratings = {k:rating(k,v,a["target_margin"]) for k,v in ratios.items()}
    overall = round(sum(score_for(v) for v in ratings.values())/len(ratings))
    assessment = "Strong / healthy" if overall >= 75 else "Mixed / watch" if overall >= 55 else "Weak / risky" if overall >= 35 else "Incomplete or distressed"
    revs=[revenue]; margins=[ebitda/revenue if revenue else 0]
    for _ in range(5):
        revs.append(revs[-1]*(1+a["growth"])); margins.append(margins[-1]+(a["target_margin"]-margins[-1])*.20)
    fcfs=[]; pvs=[]
    for year in range(1,6):
        rev=revs[year]; eb=rev*margins[year]; da=rev*a["da"]; ebit=eb-da; tax=max(0,ebit*a["tax"])
        nopat=ebit-tax; capex=rev*a["capex"]; delta_nwc=(revs[year]-revs[year-1])*a["nwc"]
        fcf=nopat+da-capex-delta_nwc; fcfs.append(fcf); pvs.append(fcf/(1+a["wacc"])**year)
    tv=fcfs[-1]*(1+a["terminal_growth"])/(a["wacc"]-a["terminal_growth"]) if a["wacc"]>a["terminal_growth"] else 0
    dcf_base=sum(pvs)+tv/(1+a["wacc"])**5
    dcf=(dcf_base*.9,dcf_base,dcf_base*1.1)
    mult=(ebitda*a["multiple_low"],ebitda*a["multiple_base"],ebitda*a["multiple_high"])
    w=a["dcf_weight"]; blended=tuple(d*w+m*(1-w) for d,m in zip(dcf,mult)); equity=tuple(v-debt+cash for v in blended)
    gap=abs(dcf_base-mult[1])/((dcf_base+mult[1])/2) if dcf_base+mult[1] else 0
    return ratios,ratings,overall,assessment,revs,margins,fcfs,dcf,mult,blended,equity,gap,tv

st.title("Quick & Dirty Biz Evaluation Kit")
st.caption("A transparent first-pass health check and indicative valuation — useful for screening and discussion, never a substitute for due diligence.")

context = st.segmented_control("Choose the benchmark context", ["US Context","Italian Context"], default="US Context", selection_mode="single") or "US Context"
symbol = "$" if context == "US Context" else "€"
currency_name = "USD" if context == "US Context" else "EUR"

tab_eval, tab_detail, tab_manual = st.tabs([":material/monitoring: Evaluation", ":material/calculate: Valuation detail", ":material/menu_book: User's Mini-Manual"])

with st.sidebar:
    st.header("Company inputs")
    company=st.text_input("Company name", "ExampleCo")
    industry=st.selectbox("Industry", INDUSTRIES)
    revenue=st.number_input(f"Revenue ({symbol})", min_value=1.0, value=100000.0, step=1000.0)
    ebitda=st.number_input(f"EBITDA ({symbol})", value=15000.0, step=1000.0)
    net_income=st.number_input(f"Net income ({symbol})", value=7000.0, step=1000.0)
    opex=st.number_input(f"Operating costs ({symbol})", min_value=0.0, value=85000.0, step=1000.0)
    current_ratio=st.number_input("Current ratio (x)", min_value=0.0, value=1.40, step=.10)
    cash=st.number_input(f"Cash ({symbol})", min_value=0.0, value=8000.0, step=1000.0)
    debt=st.number_input(f"Total debt ({symbol})", min_value=0.0, value=30000.0, step=1000.0)
    st.caption("Use one consistent period and currency. LTM or the latest fiscal year usually works best.")

a=ASSUMPTIONS[context][industry]
ratios,ratings,overall,assessment,revs,margins,fcfs,dcf,mult,blended,equity,gap,tv=model(revenue,ebitda,net_income,opex,current_ratio,cash,debt,a)

with tab_eval:
    st.subheader(f"{company} · {industry} · {context}")
    c1,c2,c3,c4=st.columns(4)
    c1.metric("Overall health score", f"{overall}/100")
    c2.metric("Assessment", assessment)
    c3.metric("Indicative equity value", money(equity[1],symbol))
    c4.metric("Model status", "PASS" if ratings["Opex vs EBITDA check"]=="OK" and equity[1]>=0 else "REVIEW")
    st.caption(f"Indicative equity range ({currency_name}): {equity[0]:,.0f} — {equity[2]:,.0f}. This is a model range, not a fairness opinion or market price.")
    st.subheader("Financial health dashboard")
    formats={"EBITDA margin":"{:.1%}","Net margin":"{:.1%}","Cost-to-income":"{:.1%}","Current ratio":"{:.2f}x","Cash / debt":"{:.1%}","Gross debt / EBITDA":"{:.2f}x","Net debt / EBITDA":"{:.2f}x","Opex vs EBITDA check":"{:.1%}"}
    explanations={"EBITDA margin":"Operating profit generated from revenue.","Net margin":"Final profit after all costs.","Cost-to-income":"Operating-cost burden; lower is better.","Current ratio":"Short-term asset cover for short-term liabilities.","Cash / debt":"Cash buffer relative to financial debt.","Gross debt / EBITDA":"Leverage before cash.","Net debt / EBITDA":"Leverage after cash.","Opex vs EBITDA check":"Whether revenue, costs and EBITDA are mutually coherent."}
    for i,(name,value) in enumerate(ratios.items()):
        if i%2==0: row=st.columns(2)
        with row[i%2].container(border=True):
            status=ratings[name]; color="green" if status in ("Healthy","OK") else "orange" if status=="Watch" else "red"
            st.markdown(f"**{name}**  :{color}-badge[{status}]")
            st.metric("Result", formats[name].format(value) if math.isfinite(value) else "n/m")
            st.caption(explanations[name])
    if gap > .40: st.warning("DCF and market-multiple values diverge by more than 40%. Treat the headline valuation as highly assumption-sensitive.", icon=":material/warning:")

with tab_detail:
    st.subheader("Two methods, one deliberately broad range")
    methods=st.columns(3)
    for col,label,vals in zip(methods,["Simplified DCF","EV / EBITDA multiple","Blended enterprise value"],[dcf,mult,blended]):
        with col.container(border=True):
            st.markdown(f"**{label}**"); st.metric("Base EV",money(vals[1],symbol)); st.caption(f"Low {money(vals[0],symbol)} · High {money(vals[2],symbol)}")
    st.subheader("Five-year operating path used by the DCF")
    st.line_chart({"Revenue":revs[1:],"EBITDA":[r*m for r,m in zip(revs[1:],margins[1:])],"Unlevered FCF":fcfs}, x_label="Forecast year", y_label=f"Amount ({symbol})")
    with st.expander("View the selected assumptions", icon=":material/tune:"):
        st.write({"Revenue growth":f'{a["growth"]:.1%}',"Target EBITDA margin":f'{a["target_margin"]:.1%}',"WACC":f'{a["wacc"]:.1%}',"Terminal growth":f'{a["terminal_growth"]:.1%}',"Tax rate":f'{a["tax"]:.1%}',"EV/EBITDA range":f'{a["multiple_low"]:.1f}x–{a["multiple_high"]:.1f}x',"DCF weight":f'{a["dcf_weight"]:.0%}'})
    st.caption(f"Terminal value: {money(tv,symbol)} before discounting · DCF/multiple valuation gap: {gap:.1%}")

with tab_manual:
    st.header("User's Mini-Manual")
    st.subheader("How to play")
    st.markdown("""
1. Choose **US Context** or **Italian Context**. This changes currency display and the sector benchmark assumptions—not your company inputs.
2. Enter eight figures from one consistent accounting period. Select the industry whose economics most closely resemble the business.
3. Read the health dashboard first. A high score means the entered ratios clear simple benchmark rules; it does **not** prove that the company is good or the accounts are reliable.
4. Then compare the DCF and multiple valuations. A large gap is a warning that the answer depends heavily on assumptions.
5. Stress-test the conclusion by changing EBITDA, debt, cash and the chosen industry. Do not quote a single value without the low–high range.
    """)
    st.subheader("The eight variables")
    st.markdown("""
- **Revenue:** sales for the latest year or last twelve months.
- **EBITDA:** operating profit before depreciation, amortisation, interest and tax; adjust material one-offs consistently.
- **Net income:** bottom-line profit attributable to ordinary shareholders where possible.
- **Operating costs:** normally revenue minus EBITDA, before D&A. The coherence check flags incompatible definitions.
- **Current ratio:** current assets divided by current liabilities.
- **Cash:** cash and cash equivalents available for the equity-value bridge.
- **Total debt:** interest-bearing debt; leases, pensions and minorities are not automatically captured.
- **Industry:** supplies deliberately simple benchmark margins, growth, WACC, tax, reinvestment and EV/EBITDA assumptions.
    """)
    st.subheader("What the valuation does")
    st.markdown(r"""
The DCF projects five years of revenue and lets EBITDA margin move 20% of the way toward the sector target each year. It estimates unlevered free cash flow as
$$FCF = EBIT(1-T) + D\&A - Capex - \Delta NWC,$$
then discounts it at WACC and adds a Gordon-growth terminal value. The multiple method applies the selected sector EV/EBITDA range to current EBITDA. The two enterprise values are blended using the workbook's sector weight, then converted to equity value by subtracting debt and adding cash.

**Important:** this is a pedagogical first diagnostic, not an investment recommendation, fairness opinion, credit rating or substitute for a full forecast. Banks, insurers and many real-estate vehicles require sector-specific valuation methods. Comparable-company multiples, company-specific WACC, debt maturities, leases, pensions, minorities, exceptional items and accounting quality require separate work.
    """)
    st.info("The app is free to use; no payment or personal data is required. If 'how to pay' meant something different, the wording can easily be changed.", icon=":material/info:")

st.caption("© Marco Ventoruzzo 2026 · made with support from Codex")
