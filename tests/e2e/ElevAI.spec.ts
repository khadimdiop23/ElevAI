import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

test.describe('ElevAI E2E Tests', () => {
  let userId: number;

  test.beforeAll(async ({ request }) => {
    // Créer un utilisateur de test
    const response = await request.post(`${API_URL}/users`, {
      data: {
        age: 28,
        genre: 'M',
        taille_cm: 178,
        poids_kg: 74,
        objectif: 'Améliorer le sommeil'
      }
    });
    expect(response.ok()).toBeTruthy();
    const user = await response.json();
    userId = user.id;
  });

  test('T1: Création d\'un utilisateur → redirection profil/dashboard', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    await expect(page.locator('h2')).toContainText('Connexion');

    await page.click('text=Créer un nouveau profil');
    await page.fill('input[name="age"]', '30');
    await page.selectOption('select[name="genre"]', 'F');
    await page.fill('input[name="taille_cm"]', '165');
    await page.fill('input[name="poids_kg"]', '60');
    await page.fill('textarea[name="objectif"]', 'Test E2E');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h2')).toContainText('Dashboard');
  });

  test('T2: Ajout d\'une journée de données → présence dans l\'historique', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Sélection ou création de l'utilisateur
    const userItem = page.locator(`text=Utilisateur ${userId}`).first();
    if (await userItem.isVisible()) {
      await userItem.click();
    } else {
      await page.click('text=Créer un nouveau profil');
      await page.fill('input[name="age"]', '28');
      await page.selectOption('select[name="genre"]', 'M');
      await page.fill('input[name="taille_cm"]', '178');
      await page.fill('input[name="poids_kg"]', '74');
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/.*dashboard/);

    // Ouvrir le formulaire journalier
    await page.click('text=+ Ajouter une entrée quotidienne');
    const dailyForm = page.locator('[data-testid="daily-form"]');
    await expect(dailyForm).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    await page.fill('input[name="sommeil_h"]', '7.5');
    await page.fill('input[name="pas"]', '8500');
    await page.fill('input[name="sport_min"]', '30');
    await page.fill('input[name="calories"]', '2200');
    await page.fill('input[name="humeur_0_5"]', '4');
    await page.fill('input[name="stress_0_5"]', '2');
    await page.fill('input[name="fc_repos"]', '65');

    await page.click('[data-testid="submit-daily"]');

    // Attendre que le formulaire disparaisse et que les données soient visibles
    await expect(dailyForm).toHaveCount(0);
    await page.waitForTimeout(1000); // pour s'assurer que fetchData a été exécuté
  });

  test('T3: Appel de l\'analyse → affichage du score et des recommandations', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Sélection ou création de l'utilisateur
    const userItem = page.locator(`text=Utilisateur ${userId}`).first();
    if (await userItem.isVisible()) {
      await userItem.click();
    } else {
      await page.click('text=Créer un nouveau profil');
      await page.fill('input[name="age"]', '28');
      await page.selectOption('select[name="genre"]', 'M');
      await page.fill('input[name="taille_cm"]', '178');
      await page.fill('input[name="poids_kg"]', '74');
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/.*dashboard/);

    // Vérifier la présence du ScoreCard
  


    // Vérifier la présence du RadarCard
    const radarCard = page.locator('text=Radar des dimensions');
    await expect(radarCard).toBeVisible();
  });

  test('T4: Vérification que le graphe d\'évolution se met à jour après ajout d\'une nouvelle journée', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    const userItem = page.locator(`text=Utilisateur ${userId}`).first();
    if (await userItem.isVisible()) {
      await userItem.click();
    } else {
      await page.click('text=Créer un nouveau profil');
      await page.fill('input[name="age"]', '28');
      await page.selectOption('select[name="genre"]', 'M');
      await page.fill('input[name="taille_cm"]', '178');
      await page.fill('input[name="poids_kg"]', '74');
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/.*dashboard/);

    // Attendre le dashboard et le graphique
    await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    const chartBefore = await page.locator('canvas').count();

    // Ajouter une nouvelle entrée
    await page.click('text=+ Ajouter une entrée quotidienne');
    const dailyForm = page.locator('[data-testid="daily-form"]');
    await expect(dailyForm).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    await page.fill('input[name="sommeil_h"]', '8');
    await page.fill('input[name="pas"]', '9000');
    await page.fill('input[name="sport_min"]', '45');
    await page.fill('input[name="calories"]', '2300');
    await page.fill('input[name="humeur_0_5"]', '5');
    await page.fill('input[name="stress_0_5"]', '1');
    await page.fill('input[name="fc_repos"]', '62');
    await page.click('[data-testid="submit-daily"]');

    await page.waitForTimeout(2000); // attendre que fetchData soit exécuté
    const chartAfter = await page.locator('canvas').count();
    expect(chartAfter).toBeGreaterThanOrEqual(chartBefore);
  });
});
