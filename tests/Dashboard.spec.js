import { test, expect } from '@playwright/test';

test.describe('ElevAI Dashboard E2E', () => {

  const baseUrl = 'http://localhost:3000';
  const testUser = {
    age: 25,
    genre: 'M',
    taille_cm: 175,
    poids_kg: 70,
    objectif: null
  };

  test('T1. Création d’un utilisateur → redirection profil/dashboard', async ({ page }) => {
    await page.goto(`${baseUrl}/signup`);
    await page.fill('input[name="age"]', testUser.age.toString());
    await page.fill('input[name="genre"]', testUser.genre);
    await page.fill('input[name="taille_cm"]', testUser.taille_cm.toString());
    await page.fill('input[name="poids_kg"]', testUser.poids_kg.toString());
    await page.click('button[type="submit"]');

    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h2')).toHaveText('Dashboard');
  });

  test('T2. Ajout d’une journée de données → présence dans l’historique', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`);

    // Ouvrir le formulaire
    await page.click('text=+ Ajouter une entrée quotidienne');

    // Vérifier que le formulaire est visible
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Remplir le formulaire
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    await page.fill('input[name="sommeil_h"]', '8');
    await page.fill('input[name="pas"]', '10000');
    await page.fill('input[name="sport_min"]', '30');
    await page.fill('input[name="calories"]', '2200');
    await page.fill('input[name="humeur_0_5"]', '4');
    await page.fill('input[name="stress_0_5"]', '2');
    await page.fill('input[name="fc_repos"]', '65');

    await page.click('button:text("Ajouter")');

    // Vérifier que la journée apparaît dans l'historique
    await expect(page.locator(`text=${today}`)).toBeVisible();
  });

  test('T3. Appel de l’analyse → affichage du score et des recommandations', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`);

    // Vérifier que le score est affiché
    const scoreCard = page.locator('.score-card');
    await expect(scoreCard).toBeVisible();
    await expect(scoreCard.locator('.score-value')).not.toHaveText('');

    // Vérifier la catégorie
    await expect(scoreCard.locator('.score-category')).toBeVisible();

    // Vérifier la prédiction de risque
    await expect(scoreCard.locator('.risk-prediction')).toBeVisible();

    // Vérifier les explications
    await expect(scoreCard.locator('.explanations')).toBeVisible();

    // Vérifier les recommandations
    await expect(scoreCard.locator('.recommendations')).toBeVisible();
  });

  test('T4. Vérification que le graphe d’évolution se met à jour après ajout d’une nouvelle journée', async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`);

    const chartBefore = await page.locator('.chart-card canvas').screenshot();

    // Ajouter une nouvelle journée
    await page.click('text=+ Ajouter une entrée quotidienne');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await page.fill('input[name="date"]', tomorrow);
    await page.fill('input[name="sommeil_h"]', '7');
    await page.fill('input[name="pas"]', '8000');
    await page.fill('input[name="sport_min"]', '20');
    await page.fill('input[name="calories"]', '2100');
    await page.fill('input[name="humeur_0_5"]', '3');
    await page.fill('input[name="stress_0_5"]', '2');
    await page.fill('input[name="fc_repos"]', '70');
    await page.click('button:text("Ajouter")');

    // Vérifier que le graphe a changé
    const chartAfter = await page.locator('.chart-card canvas').screenshot();
    expect(chartBefore).not.toEqual(chartAfter);
  });

});
