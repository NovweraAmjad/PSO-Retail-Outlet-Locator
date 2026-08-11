from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class Station(BaseModel):
    id: int
    s_no: Optional[int]
    code_no: Optional[int]
    merchant_id_mid: Optional[str]
    pso_cards_enabled: Optional[str]
    shop_stop: Optional[str]
    vibe: Optional[str]
    alliances_qsr: Optional[str]
    type: Optional[str]
    coco_site: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    zone: Optional[str]
    pso_division: Optional[str]
    name_of_outlets: Optional[str]
    city: Optional[str]
    district: Optional[str]
    province: Optional[str]
    location: Optional[str]
    r95_facility: Optional[str]
    octane_status: Optional[str]
    distance_km: Optional[float] = None
