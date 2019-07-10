export const template = html;
export const style = html;
export const customBlock = html; 

export function html(strings:TemplateStringsArray, ...values:any[]) {
  return strings.toString();
}

