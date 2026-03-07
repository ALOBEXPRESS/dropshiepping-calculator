// Amazon Categories and Commission Rates
export interface AmazonCategory {
  name: string;
  commission: number;
  minimum: number;
}

export const amazonCategories: { [key: string]: AmazonCategory } = {
  'livros': { name: 'Livros', commission: 15, minimum: 1.00 },
  'eletronicos': { name: 'Eletrônicos portáteis, videogames, câmera e fotografia', commission: 13, minimum: 1.00 },
  'roupas': { name: 'Roupas e acessórios, Joias, Bagagem e acessórios de viagem', commission: 14, minimum: 1.00 },
  'beleza': { name: 'Beleza', commission: 13, minimum: 1.00 },
  'higiene': { name: 'Higiene e Cuidados Pessoais', commission: 14, minimum: 1.00 },
  'casa': { name: 'Casa e Cozinha', commission: 13, minimum: 1.00 },
  'brinquedos': { name: 'Brinquedos e Jogos', commission: 12, minimum: 1.00 },
  'ferramentas': { name: 'Ferramentas e Construção', commission: 11, minimum: 1.00 },
};

export type AmazonPlanType = 'individual' | 'profissional';
