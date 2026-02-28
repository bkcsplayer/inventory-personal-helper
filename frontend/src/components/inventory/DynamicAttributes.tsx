import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ATTRIBUTE_TEMPLATES: Record<string, { key: string; label: string; placeholder: string }[]> = {
  GPU: [
    { key: "model", label: "Model", placeholder: "RTX 3090" },
    { key: "vram_gb", label: "VRAM (GB)", placeholder: "24" },
    { key: "tdp_w", label: "TDP (W)", placeholder: "350" },
    { key: "slot", label: "Slot", placeholder: "PCIe x16" },
  ],
  "矿机": [
    { key: "hashrate", label: "Hashrate", placeholder: "110MH/s" },
    { key: "algorithm", label: "Algorithm", placeholder: "Ethash" },
    { key: "psu_w", label: "PSU (W)", placeholder: "750" },
    { key: "serial", label: "Serial", placeholder: "RG-XXXX" },
  ],
  "网线": [
    { key: "length_m", label: "Length (m)", placeholder: "5" },
    { key: "connector", label: "Connector", placeholder: "LC-LC" },
    { key: "speed", label: "Speed", placeholder: "10G" },
    { key: "color", label: "Color", placeholder: "blue" },
  ],
  "光纤": [
    { key: "length_m", label: "Length (m)", placeholder: "5" },
    { key: "connector", label: "Connector", placeholder: "LC-LC" },
    { key: "speed", label: "Speed", placeholder: "10G" },
    { key: "color", label: "Color", placeholder: "blue" },
  ],
  "3D耗材": [
    { key: "material", label: "Material", placeholder: "PLA" },
    { key: "color", label: "Color", placeholder: "black" },
    { key: "diameter_mm", label: "Diameter (mm)", placeholder: "1.75" },
    { key: "weight_kg", label: "Weight (kg)", placeholder: "1.0" },
  ],
  "电子元器件": [
    { key: "package", label: "Package", placeholder: "SMD-0402" },
    { key: "value", label: "Value", placeholder: "10kΩ" },
    { key: "tolerance", label: "Tolerance", placeholder: "1%" },
  ],
  "电动工具": [
    { key: "voltage", label: "Voltage", placeholder: "20V" },
    { key: "brand", label: "Brand", placeholder: "Dewalt" },
    { key: "battery_type", label: "Battery Type", placeholder: "DCB205" },
  ],
};

interface DynamicAttributesProps {
  category: string;
  attributes: Record<string, string>;
  onChange: (attributes: Record<string, string>) => void;
}

export function DynamicAttributes({ category, attributes, onChange }: DynamicAttributesProps) {
  const template = ATTRIBUTE_TEMPLATES[category];

  if (!template) {
    return (
      <div className="space-y-2">
        <Label>Custom Attributes (JSON)</Label>
        <Input
          value={JSON.stringify(attributes)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // invalid JSON, ignore
            }
          }}
          placeholder='{"key": "value"}'
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {template.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-1">
          <Label className="text-xs">{label}</Label>
          <Input
            value={attributes[key] || ""}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...attributes, [key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
