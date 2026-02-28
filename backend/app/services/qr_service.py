import io

import qrcode
from qrcode.image.pil import PilImage


def generate_qr_code(data: str, box_size: int = 10, border: int = 4) -> bytes:
    qr = qrcode.QRCode(version=1, box_size=box_size, border=border)
    qr.add_data(data)
    qr.make(fit=True)
    img: PilImage = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
