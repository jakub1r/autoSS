import { Page } from 'puppeteer';
import { Dispatch, SetStateAction } from 'react';
import { text } from 'stream/consumers';

export class MigloPage {
  page: any;
  private URL: string = 'https://b2b.miglo.pl/';
  constructor(page: any) {
    this.page = page;
  }

  elements = {
    emailInput: () => this.page.locator("input[type='email']"),
    passwordInput: () => this.page.locator("input[type='password']"),
    cartBtn: () => this.page.$('#CartButton'),
    startFormBtn: () =>
      this.page.$('div.col-xl-4.col-12 div.panel button.btn-hover.color-1'),
    continueBtns: () =>
      this.page.$$(
        "div.row.mt4.nb-2 div.col.text-center button[type='submit']",
      ),
    ownTransportInput: () => this.page.$("input[value='TransportWlasny']"),
    statementBtn: () =>
      this.page.$('label.form-check-label.input-label.required'),
    orderAndPayBtn: () =>
      this.page.$(
        'div.row.mt-4.mb-2 div.col.text-center button.btn-hover.color-1',
      ),
  };

  async goToPage() {
    await this.page.goto(this.URL);
  }

  async login(email: string, password: string) {
    await this.elements.emailInput().fill(email);
    await this.elements.passwordInput().fill(password);
    await this.page.keyboard.press('Enter');
    const exists = await this.page
      .waitForSelector("div[role='alert']", { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
  }

  async getAllProductName() {
    const texts = await this.page.$$eval('table tr', (rows: any) => {
      return rows.map((row: any) => {
        const cells = row.querySelectorAll('td');
        return cells[2] ? cells[2].innerText.trim() : null;
      });
    });
    return texts;
  }

  async addMatchingProductsToCart(values: string[]) {
    const rows = await this.getTableRows();
    for (const value of values) {
      await this.processMatchingRows(rows, value);
    }
  }

  async getTableRows() {
    return await this.page.$$eval('table tr', (rows: any) => {
      return rows.map((row: any, index: any) => {
        const cells = row.querySelectorAll('td');
        return {
          text: cells[2] ? cells[2].innerText.trim().toLowerCase() : null,
          index: index,
        };
      });
    });
  }

  async processMatchingRows(rows: any, value: any) {
    const matchingRows = rows.filter(
      (row: any) => row.text && row.text.includes(value.toLowerCase()),
    );

    if (matchingRows.length > 0) {
      for (const matchingRow of matchingRows) {
        await this.clickRowButton(matchingRow.index);
      }
    } else {
      console.log(`Nie znaleziono produktów pasujących do: ${value}`);
    }
  }

  async clickRowButton(index: any) {
    await this.page.evaluate((index: any) => {
      const row = document.querySelectorAll('table tr')[index];
      const button = row.querySelector('button');
      if (button) {
        button.click();
      }
    }, index);
  }

  async buy() {
    const btn = await this.elements.cartBtn();
    const priceText = await this.page.evaluate(
      (el: any) => el.textContent,
      btn,
    );
    const price = priceText.trim().split(' ')[0];
    if (price !== '0,00') {
      await btn.click();
      await this.page.waitForSelector('.button-cart', { visible: true });
      const buybtn = await this.page.$('.button-cart');
      await buybtn.click();
      // Wypełnienie formularza. po każdym kliknięciu trzeba dać delay
      this.prepareForm();
    }
  }
  async prepareForm() {
    await this.elements.startFormBtn().then((btn: any) => btn?.click());
    const continueBtns = await this.elements.continueBtns();
    // 1. Dane
    await continueBtns[0].click();
    // 2. Adres dostawy
    await continueBtns[1].click();
    // 3. Sposob dostawy
    await this.elements
      .ownTransportInput()
      .then((input: any) => input?.click());
    await continueBtns[2].click();
    // 4. Metoda platnosci
    await this.elements.statementBtn().then((btn: any) => btn?.click());
    //await this.elements.orderAndPayBtn().then((btn: any) => btn?.click());
  }
}
