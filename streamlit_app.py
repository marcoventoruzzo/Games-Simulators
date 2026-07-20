import streamlit as st
import pandas as pd
from economic_model import POLICIES, BASELINES, HORIZONS, METRICS, UNITS, simulate, grade

st.set_page_config(page_title="Maynard — The Political Economy Game",page_icon="🎩",layout="wide")
st.markdown("""<style>
:root{--navy:#10243e;--cream:#f7f3e9;--gold:#e9b949;--blue:#3c78d8;--red:#d9534f}
.stApp{background:linear-gradient(135deg,#f9f6ee 0%,#eef4fb 100%);color:#17263a}
[data-testid="stSidebar"]{background:#10243e}
[data-testid="stSidebar"] h1,[data-testid="stSidebar"] h2,[data-testid="stSidebar"] h3,[data-testid="stSidebar"] p,[data-testid="stSidebar"] label{color:#f8f4e8!important}
[data-testid="stSidebar"] details summary{background:#183a60!important;border:1px solid #4f6f91!important;border-radius:10px!important}
[data-testid="stSidebar"] details summary *{color:#ffffff!important;font-weight:750!important}
[data-testid="stSidebar"] details[open] summary{background:#24517f!important}
.hero{padding:1.1rem 1.4rem;border-radius:20px;background:linear-gradient(105deg,#10243e,#244d79);color:white;box-shadow:0 10px 28px #18324d22;margin-bottom:1rem}
.hero h1{font-size:2.35rem;margin:0}.hero p{opacity:.86;margin:.35rem 0 0}
.speech{position:relative;background:white;border:2px solid #e9b949;border-radius:18px;padding:1rem 1.1rem;box-shadow:0 8px 22px #10243e18;min-height:140px}
.speech:before{content:"";position:absolute;top:28px;left:-18px;border-width:10px 18px 10px 0;border-style:solid;border-color:transparent #e9b949 transparent transparent}
.keynes{text-align:center;font-weight:700;font-size:.92rem}.keynes img{border-radius:18px;max-height:235px;box-shadow:0 8px 22px #0003}
div[data-testid="stMetric"]{background:#ffffffcc;border:1px solid #dce5ef;padding:12px;border-radius:16px;box-shadow:0 5px 15px #20344c0d}
.smallnote{font-size:.82rem;color:#607087}.stButton button{border-radius:999px;font-weight:800}
[data-testid="stSidebar"] div[data-testid="stButton"] button{
background:#e9b949!important;border:2px solid #f4d06f!important;color:#10243e!important;
box-shadow:0 5px 14px #0000002b!important;min-height:3rem!important
}
[data-testid="stSidebar"] div[data-testid="stButton"] button *{color:#10243e!important;font-weight:850!important}
[data-testid="stSidebar"] div[data-testid="stButton"] button:hover{
background:#f4d06f!important;border-color:#ffffff!important;color:#10243e!important;transform:translateY(-1px)
}
@media (max-width:768px){
button[data-testid="stExpandSidebarButton"]{position:relative;overflow:visible!important}
button[data-testid="stExpandSidebarButton"]::after{
content:"Input variables";position:absolute;left:2.1rem;top:50%;transform:translateY(-50%);
padding:.32rem .62rem;border:1px solid #e9b949;border-radius:999px;background:#fff8df;color:#10243e;
box-shadow:0 2px 8px #10243e1f;font-size:.78rem;font-weight:800;line-height:1;white-space:nowrap;pointer-events:none
}
}
</style>""",unsafe_allow_html=True)

st.markdown('<div class="hero"><h1>Maynard — The Political Economy Game</h1><p>You are the enlightened ruler. Move policy levers, follow the transmission channels, and live with the trade-offs.</p><p style="font-size:.78rem;margin-top:.7rem">© Marco Ventoruzzo 2026 · Made with support from Codex</p></div>',unsafe_allow_html=True)

with st.sidebar:
    st.header("Policy room")
    st.caption("Baseline: a hypothetical advanced, open economy. Every slider reruns the model instantly.")
    if st.button("↺ Restore baseline",use_container_width=True):
        for k,v in BASELINES.items(): st.session_state[k]=v
        st.session_state.pop("verdict",None); st.rerun()
    policy={}
    for cat,items in POLICIES.items():
        with st.expander(cat,expanded=cat in ("Monetary policy","Public spending")):
            for key,label,base,lo,hi,step,unit in items:
                policy[key]=st.slider(label,float(lo),float(hi),float(st.session_state.get(key,base)),float(step),key=key,help=f"Unit: {unit}. Baseline: {base:g}.")

rows=simulate(policy); baseline=simulate(BASELINES); df=pd.DataFrame(rows).set_index("Horizon")
top, portrait = st.columns([3.2,1.25],gap="large")
with top:
    st.subheader("The economy at a glance")
    hc=st.segmented_control("Choose a horizon",HORIZONS,default="1 year",selection_mode="single") or "1 year"
    idx=HORIZONS.index(hc); r=rows[idx]; b=baseline[idx]
    c1,c2,c3,c4=st.columns(4)
    for col,m in zip((c1,c2,c3,c4),("GDP growth","Inflation","Unemployment","Public debt")):
        col.metric(m,f'{r[m]:.1f}{"%" if m!="Public debt" else "% of GDP"}',f'{r[m]-b[m]:+.1f} vs baseline',border=True)
    st.caption("The comparison is against the same economy with all controls at their baseline—not against last year.")
with portrait:
    st.image("JMK.webp",width=190)
    st.markdown('<div class="keynes">John Maynard Keynes (1883–1946)</div>',unsafe_allow_html=True)
    if st.button("Maynard, grade me.",type="primary",use_container_width=True): st.session_state.verdict=grade(policy,rows)
with st.container():
    if "verdict" in st.session_state:
        letter,score,text=st.session_state.verdict
        st.markdown(f'<div class="speech"><b>Grade {letter} · {score}/100</b><br><br>{text}</div>',unsafe_allow_html=True)
    else: st.markdown('<div class="speech"><b>Maynard is watching.</b><br><br>Set your policies, then ask for his verdict. He will praise mechanisms, not slogans—and point out the bill.</div>',unsafe_allow_html=True)

st.divider(); st.subheader(f"Dashboard · {hc}")
tabs=st.tabs(list(METRICS))
for tab,(category,metrics) in zip(tabs,METRICS.items()):
    with tab:
        for start in range(0,len(metrics),4):
            cols=st.columns(min(4,len(metrics)-start))
            for col,m in zip(cols,metrics[start:start+4]):
                val=r[m]; unit=UNITS[m]; delta=val-b[m]
                if unit=="USD bn": shown=f"${val:,.0f}bn"
                elif unit=="Gini": shown=f"{val:.3f}"
                elif unit in ("million","births/woman"): shown=f"{val:.2f}"
                elif unit=="index": shown=f"{val:.1f}"
                else: shown=f"{val:.1f}%" if unit=="%" else f"{val:.1f}"
                col.metric(m,shown,f"{delta:+.2f} vs baseline",chart_data=df[m].tolist(),chart_type="line",border=True,help=f"Unit: {unit}. Sparkline: 3 months → 10 years.")

st.divider()
with st.expander("Methodology, equations and limitations"):
    st.markdown("""
### What this is
Maynard is a **transparent teaching simulation**, not a forecast, optimisation engine or representation of any particular country. It starts from a stylised advanced open economy: GDP $1 trillion, trend real growth 2%, inflation 2.2%, unemployment 6%, public debt 70% of GDP and a 3% deficit.

### Core transmission structure
The model is semi-structural. In compact form:  
**Output = baseline trend + demand effects + supply-capacity effects.**  
Demand reacts relatively quickly to interest rates, taxes, transfers and government purchases. Productive infrastructure, education, innovation, openness and energy investment act more slowly through capital, labour supply and productivity. Monetary effects peak around one year and fade in the long run. Fiscal multipliers are deliberately moderate and differ by spending type. The **GDP growth** card reports annualised realised growth over the selected interval, so temporary demand effects are strongest at 3–12 months and fade thereafter; corporate taxation also has a modest persistent supply-side effect through investment.

Inflation combines demand pressure, monetary conditions, indirect taxes, tariffs, carbon pricing and gradual anchoring to the inflation target. Employment follows output and labour-market settings, with a non-linear penalty only when the minimum wage exceeds 60% of the median wage.

Public debt follows the standard accounting logic:  
**Debtₜ ≈ [(1 + interest rate)/(1 + nominal GDP growth)] × Debtₜ₋₁ − primary balance − privatisation proceeds.**  
Bond issuance finances the government; it is not treated as free income. Maturity and fixed-rate share slow the pass-through of market rates to interest expense.

### Reading the screen
Every card shows the selected-horizon level. The small number underneath is the difference from the unchanged-policy baseline. The sparkline always runs from **3 months → 1 year → 5 years → 10 years**. USD flows and stocks are shown in constant-price USD billions; asset prices and the exchange rate are indices where 100 is the starting point and a higher exchange-rate index means appreciation.

### Evidence used to discipline signs and magnitudes
- IMF research on public-investment multipliers and the importance of implementation capacity.
- OECD evidence on the relative growth effects of corporate, personal, consumption and recurrent property taxation.
- Standard central-bank monetary-transmission channels and the conventional *r − g* public-debt identity.

### Essential limitations
Coefficients are calibrated ranges, not econometrically estimated country parameters. There are no elections, expectations shocks, banking crises, distribution by household, sector detail or policy implementation lags beyond the four stylised horizons. Extreme slider combinations are capped to prevent absurd explosive outcomes. Use the game to compare mechanisms and trade-offs, never to claim a precise causal forecast.

**Sources:** [IMF — public investment](https://www.imf.org/en/Publications/WP/Issues/2017/10/20/The-Macroeconomic-and-Distributional-Effects-of-Public-Investment-in-Developing-Economies-45222) · [OECD — Taxation and Economic Growth](https://www.oecd.org/en/publications/taxation-and-economic-growth_241216205486.html) · [IMF — debt, rates and growth](https://www.imf.org/en/Blogs/Articles/2024/03/28/the-fiscal-and-financial-risks-of-a-high-debt-slow-growth-world)
""")
st.caption("© Marco Ventoruzzo 2026 (made with support from Codex) · Version 1.1 · Deterministic and fully offline after installation · Designed for exploration, not prediction.")
import streamlit as st
import pandas as pd
from economic_model import POLICIES, BASELINES, HORIZONS, METRICS, UNITS, simulate, grade

st.set_page_config(page_title="Maynard — The Political Economy Game",page_icon="🎩",layout="wide")
st.markdown("""<style>
:root{--navy:#10243e;--cream:#f7f3e9;--gold:#e9b949;--blue:#3c78d8;--red:#d9534f}
.stApp{background:linear-gradient(135deg,#f9f6ee 0%,#eef4fb 100%);color:#17263a}
[data-testid="stSidebar"]{background:#10243e}
[data-testid="stSidebar"] h1,[data-testid="stSidebar"] h2,[data-testid="stSidebar"] h3,[data-testid="stSidebar"] p,[data-testid="stSidebar"] label{color:#f8f4e8!important}
[data-testid="stSidebar"] details summary{background:#183a60!important;border:1px solid #4f6f91!important;border-radius:10px!important}
[data-testid="stSidebar"] details summary *{color:#ffffff!important;font-weight:750!important}
[data-testid="stSidebar"] details[open] summary{background:#24517f!important}
.hero{padding:1.1rem 1.4rem;border-radius:20px;background:linear-gradient(105deg,#10243e,#244d79);color:white;box-shadow:0 10px 28px #18324d22;margin-bottom:1rem}
.hero h1{font-size:2.35rem;margin:0}.hero p{opacity:.86;margin:.35rem 0 0}
.speech{position:relative;background:white;border:2px solid #e9b949;border-radius:18px;padding:1rem 1.1rem;box-shadow:0 8px 22px #10243e18;min-height:140px}
.speech:before{content:"";position:absolute;top:28px;left:-18px;border-width:10px 18px 10px 0;border-style:solid;border-color:transparent #e9b949 transparent transparent}
.keynes{text-align:center;font-weight:700;font-size:.92rem}.keynes img{border-radius:18px;max-height:235px;box-shadow:0 8px 22px #0003}
div[data-testid="stMetric"]{background:#ffffffcc;border:1px solid #dce5ef;padding:12px;border-radius:16px;box-shadow:0 5px 15px #20344c0d}
.smallnote{font-size:.82rem;color:#607087}.stButton button{border-radius:999px;font-weight:800}
[data-testid="stSidebar"] div[data-testid="stButton"] button{
background:#e9b949!important;border:2px solid #f4d06f!important;color:#10243e!important;
box-shadow:0 5px 14px #0000002b!important;min-height:3rem!important
}
[data-testid="stSidebar"] div[data-testid="stButton"] button *{color:#10243e!important;font-weight:850!important}
[data-testid="stSidebar"] div[data-testid="stButton"] button:hover{
background:#f4d06f!important;border-color:#ffffff!important;color:#10243e!important;transform:translateY(-1px)
}
</style>""",unsafe_allow_html=True)

st.markdown('<div class="hero"><h1>Maynard — The Political Economy Game</h1><p>You are the enlightened ruler. Move policy levers, follow the transmission channels, and live with the trade-offs.</p><p style="font-size:.78rem;margin-top:.7rem">© Marco Ventoruzzo 2026 · Made with support from Codex</p></div>',unsafe_allow_html=True)

with st.sidebar:
    st.header("Policy room")
    st.caption("Baseline: a hypothetical advanced, open economy. Every slider reruns the model instantly.")
    if st.button("↺ Restore baseline",use_container_width=True):
        for k,v in BASELINES.items(): st.session_state[k]=v
        st.session_state.pop("verdict",None); st.rerun()
    policy={}
    for cat,items in POLICIES.items():
        with st.expander(cat,expanded=cat in ("Monetary policy","Public spending")):
            for key,label,base,lo,hi,step,unit in items:
                policy[key]=st.slider(label,float(lo),float(hi),float(st.session_state.get(key,base)),float(step),key=key,help=f"Unit: {unit}. Baseline: {base:g}.")

rows=simulate(policy); baseline=simulate(BASELINES); df=pd.DataFrame(rows).set_index("Horizon")
top, portrait = st.columns([3.2,1.25],gap="large")
with top:
    st.subheader("The economy at a glance")
    hc=st.segmented_control("Choose a horizon",HORIZONS,default="1 year",selection_mode="single") or "1 year"
    idx=HORIZONS.index(hc); r=rows[idx]; b=baseline[idx]
    c1,c2,c3,c4=st.columns(4)
    for col,m in zip((c1,c2,c3,c4),("GDP growth","Inflation","Unemployment","Public debt")):
        col.metric(m,f'{r[m]:.1f}{"%" if m!="Public debt" else "% of GDP"}',f'{r[m]-b[m]:+.1f} vs baseline',border=True)
    st.caption("The comparison is against the same economy with all controls at their baseline—not against last year.")
with portrait:
    st.image("JMK.webp",width=190)
    st.markdown('<div class="keynes">John Maynard Keynes (1883–1946)</div>',unsafe_allow_html=True)
    if st.button("Maynard, grade me.",type="primary",use_container_width=True): st.session_state.verdict=grade(policy,rows)
with st.container():
    if "verdict" in st.session_state:
        letter,score,text=st.session_state.verdict
        st.markdown(f'<div class="speech"><b>Grade {letter} · {score}/100</b><br><br>{text}</div>',unsafe_allow_html=True)
    else: st.markdown('<div class="speech"><b>Maynard is watching.</b><br><br>Set your policies, then ask for his verdict. He will praise mechanisms, not slogans—and point out the bill.</div>',unsafe_allow_html=True)

st.divider(); st.subheader(f"Dashboard · {hc}")
tabs=st.tabs(list(METRICS))
for tab,(category,metrics) in zip(tabs,METRICS.items()):
    with tab:
        for start in range(0,len(metrics),4):
            cols=st.columns(min(4,len(metrics)-start))
            for col,m in zip(cols,metrics[start:start+4]):
                val=r[m]; unit=UNITS[m]; delta=val-b[m]
                if unit=="USD bn": shown=f"${val:,.0f}bn"
                elif unit=="Gini": shown=f"{val:.3f}"
                elif unit in ("million","births/woman"): shown=f"{val:.2f}"
                elif unit=="index": shown=f"{val:.1f}"
                else: shown=f"{val:.1f}%" if unit=="%" else f"{val:.1f}"
                col.metric(m,shown,f"{delta:+.2f} vs baseline",chart_data=df[m].tolist(),chart_type="line",border=True,help=f"Unit: {unit}. Sparkline: 3 months → 10 years.")

st.divider()
with st.expander("Methodology, equations and limitations"):
    st.markdown("""
### What this is
Maynard is a **transparent teaching simulation**, not a forecast, optimisation engine or representation of any particular country. It starts from a stylised advanced open economy: GDP $1 trillion, trend real growth 2%, inflation 2.2%, unemployment 6%, public debt 70% of GDP and a 3% deficit.

### Core transmission structure
The model is semi-structural. In compact form:  
**Output = baseline trend + demand effects + supply-capacity effects.**  
Demand reacts relatively quickly to interest rates, taxes, transfers and government purchases. Productive infrastructure, education, innovation, openness and energy investment act more slowly through capital, labour supply and productivity. Monetary effects peak around one year and fade in the long run. Fiscal multipliers are deliberately moderate and differ by spending type. The **GDP growth** card reports annualised realised growth over the selected interval, so temporary demand effects are strongest at 3–12 months and fade thereafter; corporate taxation also has a modest persistent supply-side effect through investment.

Inflation combines demand pressure, monetary conditions, indirect taxes, tariffs, carbon pricing and gradual anchoring to the inflation target. Employment follows output and labour-market settings, with a non-linear penalty only when the minimum wage exceeds 60% of the median wage.

Public debt follows the standard accounting logic:  
**Debtₜ ≈ [(1 + interest rate)/(1 + nominal GDP growth)] × Debtₜ₋₁ − primary balance − privatisation proceeds.**  
Bond issuance finances the government; it is not treated as free income. Maturity and fixed-rate share slow the pass-through of market rates to interest expense.

### Reading the screen
Every card shows the selected-horizon level. The small number underneath is the difference from the unchanged-policy baseline. The sparkline always runs from **3 months → 1 year → 5 years → 10 years**. USD flows and stocks are shown in constant-price USD billions; asset prices and the exchange rate are indices where 100 is the starting point and a higher exchange-rate index means appreciation.

### Evidence used to discipline signs and magnitudes
- IMF research on public-investment multipliers and the importance of implementation capacity.
- OECD evidence on the relative growth effects of corporate, personal, consumption and recurrent property taxation.
- Standard central-bank monetary-transmission channels and the conventional *r − g* public-debt identity.

### Essential limitations
Coefficients are calibrated ranges, not econometrically estimated country parameters. There are no elections, expectations shocks, banking crises, distribution by household, sector detail or policy implementation lags beyond the four stylised horizons. Extreme slider combinations are capped to prevent absurd explosive outcomes. Use the game to compare mechanisms and trade-offs, never to claim a precise causal forecast.

**Sources:** [IMF — public investment](https://www.imf.org/en/Publications/WP/Issues/2017/10/20/The-Macroeconomic-and-Distributional-Effects-of-Public-Investment-in-Developing-Economies-45222) · [OECD — Taxation and Economic Growth](https://www.oecd.org/en/publications/taxation-and-economic-growth_241216205486.html) · [IMF — debt, rates and growth](https://www.imf.org/en/Blogs/Articles/2024/03/28/the-fiscal-and-financial-risks-of-a-high-debt-slow-growth-world)
""")
st.caption("© Marco Ventoruzzo 2026 (made with support from Codex) · Version 1.1 · Deterministic and fully offline after installation · Designed for exploration, not prediction.")
