"""Parametric naturally aspirated four-stroke motorcycle engine model."""
from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Iterable

import numpy as np


LAYOUTS = {
    "Single": {"torque_factor": 0.96, "torque_peak_fraction": 0.58, "curve_width": 0.30},
    "Parallel / Inline": {"torque_factor": 1.00, "torque_peak_fraction": 0.67, "curve_width": 0.32},
    "V": {"torque_factor": 0.99, "torque_peak_fraction": 0.64, "curve_width": 0.34},
    "Boxer": {"torque_factor": 0.97, "torque_peak_fraction": 0.61, "curve_width": 0.36},
}

PRESETS = {
    "Factory default": dict(displacement_cc=900, cylinders=2, layout="Parallel / Inline", compression_ratio=12.5, rev_limiter=9500),
    "Urban single": dict(displacement_cc=450, cylinders=1, layout="Single", compression_ratio=12.0, rev_limiter=9000),
    "Middleweight twin": dict(displacement_cc=700, cylinders=2, layout="Parallel / Inline", compression_ratio=11.5, rev_limiter=10500),
    "Sport triple": dict(displacement_cc=765, cylinders=3, layout="Parallel / Inline", compression_ratio=13.0, rev_limiter=12500),
    "Superbike four": dict(displacement_cc=1000, cylinders=4, layout="Parallel / Inline", compression_ratio=13.5, rev_limiter=14500),
}


@dataclass(frozen=True)
class EngineDesign:
    displacement_cc: float
    cylinders: int
    layout: str
    compression_ratio: float
    rev_limiter: int

    def validate(self) -> list[str]:
        warnings: list[str] = []
        if self.layout == "Single" and self.cylinders != 1:
            warnings.append("Single layout normally requires one cylinder.")
        if self.layout == "Boxer" and self.cylinders not in (2, 6):
            warnings.append("A boxer motorcycle engine normally uses 2 or 6 cylinders.")
        if self.layout == "V" and self.cylinders not in (2, 4):
            warnings.append("A motorcycle V-engine normally uses 2 or 4 cylinders.")
        if self.layout == "Parallel / Inline" and self.cylinders == 1:
            warnings.append("For one cylinder, select Single.")
        if self.displacement_cc / self.cylinders > 650:
            warnings.append("Very large displacement per cylinder: combustion and mechanical constraints become demanding.")
        return warnings


@dataclass(frozen=True)
class EngineResult:
    rpm: np.ndarray
    torque_nm: np.ndarray
    power_kw: np.ndarray
    power_hp: np.ndarray
    peak_torque_nm: float
    peak_power_kw: float
    peak_power_hp: float
    torque_peak_rpm: float
    power_peak_rpm: float
    peak_bmep_bar: float
    estimated_bore_mm: float
    estimated_stroke_mm: float
    mean_piston_speed_m_s: float


def simulate(design: EngineDesign, points: int = 240) -> EngineResult:
    if design.layout not in LAYOUTS:
        raise ValueError(f"Unknown layout: {design.layout}")
    if not 125 <= design.displacement_cc <= 2500:
        raise ValueError("Displacement must be between 125 and 2,500 cc.")
    if design.cylinders not in (1, 2, 3, 4, 6):
        raise ValueError("Cylinder count must be 1, 2, 3, 4 or 6.")
    if not 8 <= design.compression_ratio <= 15:
        raise ValueError("Compression ratio must be between 8 and 15.")
    if not 6000 <= design.rev_limiter <= 18000:
        raise ValueError("Rev limiter must be between 6,000 and 18,000 rpm.")

    layout = LAYOUTS[design.layout]
    high_rpm_correction = 1 - 0.025 * max(0.0, (design.rev_limiter - 12000) / 3000)
    peak_bmep = 10.8 * (design.compression_ratio / 12) ** 0.22 * layout["torque_factor"] * high_rpm_correction
    displacement_m3 = design.displacement_cc / 1_000_000
    peak_torque = peak_bmep * 100_000 * displacement_m3 / (4 * math.pi)
    torque_peak_rpm = design.rev_limiter * layout["torque_peak_fraction"]

    rpm = np.linspace(1000, design.rev_limiter, points)
    sigma = design.rev_limiter * layout["curve_width"]
    gaussian = np.exp(-0.5 * ((rpm - torque_peak_rpm) / sigma) ** 2)
    low_speed_fill = 0.72 + 0.28 * (1 - np.exp(-rpm / 1600))
    high_speed_falloff = 1 - 0.30 * np.maximum(0, (rpm - torque_peak_rpm) / max(1, design.rev_limiter - torque_peak_rpm))
    fill = np.maximum(0.10, gaussian * low_speed_fill * high_speed_falloff)
    torque = peak_torque * fill / np.max(fill)
    power_kw = torque * rpm / 9549
    power_hp = power_kw * 1.35962

    stroke_mm = 22 * 60 / (2 * design.rev_limiter) * 1000
    bore_mm = math.sqrt(((design.displacement_cc / design.cylinders) * 1000 * 4) / (math.pi * stroke_mm))
    power_idx = int(np.argmax(power_kw))

    return EngineResult(
        rpm=rpm, torque_nm=torque, power_kw=power_kw, power_hp=power_hp,
        peak_torque_nm=float(np.max(torque)), peak_power_kw=float(power_kw[power_idx]),
        peak_power_hp=float(power_hp[power_idx]), torque_peak_rpm=float(rpm[int(np.argmax(torque))]),
        power_peak_rpm=float(rpm[power_idx]), peak_bmep_bar=float(peak_bmep),
        estimated_bore_mm=bore_mm, estimated_stroke_mm=stroke_mm,
        mean_piston_speed_m_s=2 * (stroke_mm / 1000) * design.rev_limiter / 60,
    )


def design_from_preset(name: str) -> EngineDesign:
    return EngineDesign(**PRESETS[name])

