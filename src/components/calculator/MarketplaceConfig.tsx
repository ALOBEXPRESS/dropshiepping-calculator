import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Marketplace } from "@/services/referenceService";

interface MarketplaceConfigProps {
  marketplace: string;
  handleMarketplaceChange: (value: string) => void;
  marketplacesList?: Marketplace[];
}

export const MarketplaceConfig: React.FC<MarketplaceConfigProps> = ({
  marketplace,
  handleMarketplaceChange,
  marketplacesList = []
}) => {
  // Combine hardcoded system marketplaces with custom ones
  // We filter out custom ones that might duplicate system keys if necessary, 
  // but usually custom ones have UUIDs or different keys.
  
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label className="text-sm font-semibold !text-yellow-500 dark:!text-yellow-400">
        Marketplace
      </Label>
      <Select value={marketplace} onValueChange={handleMarketplaceChange}>
        <SelectTrigger
          data-testid="marketplace-select-trigger"
          className="border border-yellow-400 focus:border-yellow-500"
        >
          <SelectValue placeholder="Selecione o marketplace" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mercadolivre">Mercado Livre</SelectItem>
          <SelectItem value="shopee">Shopee</SelectItem>
          <SelectItem value="tiktok">Tiktok Shop</SelectItem>
          <SelectItem value="wordpress">Wordpress (Site)</SelectItem>
          <SelectItem value="enjoei">Enjoei</SelectItem>
          <SelectItem value="amazon">Amazon</SelectItem>
          <SelectItem value="shein">Shein</SelectItem>
          <SelectItem value="facebook">Facebook</SelectItem>
          <SelectItem value="olx">OLX</SelectItem>
          
          {/* Custom Marketplaces from DB */}
          {marketplacesList.map((mp) => (
             // Avoid duplicating system marketplaces if they happen to be in DB with same 'name' converted to lowercase? 
             // Ideally we use mp.id or a specific slug. 
             // For now, let's assume custom marketplaces don't conflict or we want to show them.
             // If mp.is_system is true, it might be one of the above, but the user said list is empty.
             !['mercadolivre', 'shopee', 'tiktok', 'wordpress', 'enjoei', 'amazon', 'shein', 'facebook', 'olx'].includes(mp.name.toLowerCase().replace(/\s/g, '')) && (
                <SelectItem key={mp.id} value={mp.name.toLowerCase().replace(/\s/g, '')}>
                  {mp.name}
                </SelectItem>
             )
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
