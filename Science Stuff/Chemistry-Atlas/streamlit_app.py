from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Chemistry Atlas",
    page_icon="⚗️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
    .block-container {max-width: 1600px; padding: .7rem 1rem 1rem;}
    [data-testid="stHeader"], [data-testid="stToolbar"] {background: transparent;}
    iframe {border-radius: 22px; background: #0b1016;}
    </style>
    """,
    unsafe_allow_html=True,
)

html = (Path(__file__).parent / "chemistry_atlas.html").read_text(encoding="utf-8")
components.html(html, height=1160, scrolling=True)
