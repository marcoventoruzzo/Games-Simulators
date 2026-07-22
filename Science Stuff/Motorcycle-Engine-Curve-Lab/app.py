from __future__ import annotations

import streamlit as st
import plotly.graph_objects as go

from engine_model import EngineDesign, LAYOUTS, PRESETS, design_from_preset, simulate

st.set_page_config(page_title="Motorcycle Engine Curve Lab", page_icon="🏍️", layout="wide")

st.markdown("""
<style>
  .stApp {background: linear-gradient(135deg,#f7fafc 0%,#eef4f9 100%);}
  .block-container {padding-top:1.3rem; max-width:1450px;}
  h1,h2,h3 {color:#102a43; letter-spacing:-0.02em;}
  [data-testid="stMetric"] {background:white; border:1px solid #d9e2ec; border-radius:16px; padding:14px 18px; box-shadow:0 5px 16px rgba(16,42,67,.06);}
  [data-testid="stSidebar"] {background:#102a43;}
  [data-testid="stSidebar"] * {color:#f0f4f8;}
  [data-testid="stSidebar"] input {color:#102a43;}
  .formula {background:#102a43; color:white; padding:14px 18px; border-radius:14px; font-family:Consolas,monospace; font-size:.92rem; line-height:1.65;}
  .small-note {color:#627d98; font-size:.88rem;}
</style>
""", unsafe_allow_html=True)

if "preset" not in st.session_state:
    st.session_state.preset = "Factory default"
if "custom" not in st.session_state:
    st.session_state.custom = PRESETS["Factory default"].copy()

def reset():
    st.session_state.preset = "Factory default"
    st.session_state.custom = PRESETS["Factory default"].copy()

with st.sidebar:
    st.title("🏍️ Design controls")
    preset_options = list(PRESETS) + ["Custom"]
    preset = st.selectbox("Starting point", preset_options, key="preset")
    st.button("↺ Reset to factory default", width="stretch", on_click=reset)
    st.divider()

    if preset == "Custom":
        c = st.session_state.custom
        c["displacement_cc"] = st.number_input("Total displacement (cc)", 125, 2500, int(c["displacement_cc"]), 25)
        c["cylinders"] = st.selectbox("Cylinder count", [1,2,3,4,6], index=[1,2,3,4,6].index(int(c["cylinders"])))
        c["layout"] = st.selectbox("Cylinder arrangement", list(LAYOUTS), index=list(LAYOUTS).index(c["layout"]))
        c["compression_ratio"] = st.slider("Compression ratio", 8.0, 15.0, float(c["compression_ratio"]), 0.1)
        c["rev_limiter"] = st.slider("Rev limiter (rpm)", 6000, 18000, int(c["rev_limiter"]), 250)
        design = EngineDesign(**c)
        st.caption("Custom controls are live: no Apply button is required.")
    else:
        design = design_from_preset(preset)
        st.info("Preset values are active. Select Custom to design your own engine.")
        st.write(f"**{design.displacement_cc:.0f} cc · {design.cylinders} cylinders · {design.layout}**")
        st.write(f"**CR {design.compression_ratio:.1f}:1 · limiter {design.rev_limiter:,} rpm**")

result = simulate(design)

st.title("Motorcycle Engine Curve Lab")
st.markdown("<p class='small-note'>Naturally aspirated four-stroke concept model · curves update instantly</p>", unsafe_allow_html=True)

warnings = design.validate()
if warnings:
    for warning in warnings: st.warning(warning)
else:
    st.success("Architecture and cylinder count are plausible.")

k1,k2,k3,k4,k5,k6 = st.columns(6)
k1.metric("Peak torque", f"{result.peak_torque_nm:.1f} N·m")
k2.metric("Peak power", f"{result.peak_power_hp:.0f} hp")
k3.metric("Torque peak", f"{result.torque_peak_rpm:,.0f} rpm")
k4.metric("Power peak", f"{result.power_peak_rpm:,.0f} rpm")
k5.metric("Peak BMEP", f"{result.peak_bmep_bar:.1f} bar")
k6.metric("Piston speed", f"{result.mean_piston_speed_m_s:.1f} m/s")

fig = go.Figure()
fig.add_trace(go.Scatter(x=result.rpm, y=result.torque_nm, name="Torque (N·m)", line=dict(color="#2F80ED", width=4), mode="lines", hovertemplate="%{x:,.0f} rpm<br>%{y:.1f} N·m<extra></extra>"))
fig.add_trace(go.Scatter(x=result.rpm, y=result.power_hp, name="Power (hp)", yaxis="y2", line=dict(color="#EB5757", width=4), mode="lines", hovertemplate="%{x:,.0f} rpm<br>%{y:.1f} hp<extra></extra>"))
fig.update_layout(
    height=510, margin=dict(l=50,r=50,t=70,b=45), template="plotly_white",
    title=dict(text="Torque and power vs engine speed — fixed scales", x=.5),
    hovermode="x unified", legend=dict(orientation="h", y=1.06, x=.5, xanchor="center"),
    xaxis=dict(title="Engine speed (rpm)", range=[1000,18000], dtick=2000, gridcolor="#d9e2ec"),
    yaxis=dict(title="Torque (N·m)", range=[0,250], dtick=50, color="#2F80ED", gridcolor="#d9e2ec"),
    yaxis2=dict(title="Power (hp)", range=[0,250], dtick=50, color="#EB5757", overlaying="y", side="right", showgrid=False),
    plot_bgcolor="white", paper_bgcolor="rgba(0,0,0,0)",
)
fig.add_vline(x=design.rev_limiter, line_dash="dash", line_color="#7b8794", annotation_text="Rev limiter", annotation_position="top")
st.plotly_chart(fig, width="stretch", config={"displaylogo":False, "scrollZoom":True})

left,right = st.columns([1.15,1])
with left:
    st.subheader("How the blue inputs become curves")
    st.markdown("""
<div class="formula">
BMEP_peak = 10.8 × (compression ratio / 12)^0.22 × layout factor × high-rpm correction<br>
T_peak = BMEP_peak × 100,000 × displacement(m³) / 4π<br>
T(n) = T_peak × f(n) / max[f(n)]<br>
P(kW,n) = T(n) × n / 9549 &nbsp;&nbsp; | &nbsp;&nbsp; P(hp,n) = P(kW,n) × 1.35962
</div>
""", unsafe_allow_html=True)
    st.caption("n is engine speed. f(n) is the layout-dependent filling curve; layout also sets torque-peak position and curve width.")
with right:
    st.subheader("Estimated geometry")
    a,b,c = st.columns(3)
    a.metric("Bore", f"{result.estimated_bore_mm:.1f} mm")
    b.metric("Stroke", f"{result.estimated_stroke_mm:.1f} mm")
    c.metric("Bore / stroke", f"{result.estimated_bore_mm/result.estimated_stroke_mm:.2f}")
    st.caption("Geometry is inferred from a 22 m/s mean-piston-speed design target at the limiter. It is a design cue, not a dyno prediction.")

with st.expander("Model scope and limitations"):
    st.write("Comparative concept model for modern naturally aspirated four-stroke petrol motorcycle engines. It does not explicitly model valve area, cam timing, combustion chamber geometry, intake/exhaust wave tuning, knock, friction maps, emissions or transient response. Dyno and simulation validation remain necessary.")
