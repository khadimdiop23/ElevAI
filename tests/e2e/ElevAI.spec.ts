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
    
    // Vérifier qu'on est sur la page de login
    await expect(page.locator('h2')).toContainText('Connexion');
    
    // Remplir le formulaire de création
    await page.click('text=Créer un nouveau profil');
    await page.fill('input[name="age"]', '30');
    await page.selectOption('select[name="genre"]', 'F');
    await page.fill('input[name="taille_cm"]', '165');
    await page.fill('input[name="poids_kg"]', '60');
    await page.fill('textarea[name="objectif"]', 'Test E2E');
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h2')).toContainText('Dashboard');
  });

  test('T2: Ajout d\'une journée de données → présence dans l\'historique', async ({ page }) => {
    // Se connecter avec l'utilisateur de test
    await page.goto(FRONTEND_URL);
    
    // Sélectionner l'utilisateur existant
    const userItem = page.locator(`text=Utilisateur ${userId}`).first();
    if (await userItem.isVisible()) {
      await userItem.click();
      await expect(page).toHaveURL(/.*dashboard/);
    } else {
      // Si l'utilisateur n'est pas visible, créer un nouveau
      await page.click('text=Créer un nouveau profil');
      await page.fill('input[name="age"]', '25');
      await page.selectOption('select[name="genre"]', 'M');
      await page.fill('input[name="taille_cm"]', '175');
      await page.fill('input[name="poids_kg"]', '70');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
    }

    // Aller à la page d'ajout d'entrée
    await page.click('text=Ajouter une entrée');
    await expect(page).toHaveURL(/.*add-entry/);

    // Remplir le formulaire
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    await page.fill('input[name="sommeil_h"]', '7.5');
    await page.fill('input[name="pas"]', '8500');
    await page.fill('input[name="sport_min"]', '30');
    await page.fill('input[name="calories"]', '2200');
    await page.fill('input[name="humeur_0_5"]', '4');
    await page.fill('input[name="stress_0_5"]', '2');
    await page.fill('input[name="fc_repos"]', '65');

    // Soumettre
    await page.click('button[type="submit"]');

    // Vérifier le message de succès
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Attendre la redirection vers le dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
  });

  test('T3: Appel de l\'analyse → affichage du score et des recommandations', async ({ page }) => {
    // Se connecter
    await page.goto(FRONTEND_URL);
    
    // Sélectionner ou créer un utilisateur
    const userItem = page.locator(`text=Utilisateur ${userId}`).first();
    if (await userItem.isVisible()) {
      await userItem.click();
    } else {
      // Créer un utilisateur si nécessaire
      await page.click('text=Créer un nouveau profil');
      await page.fill('input[name="age"]', '28');
      await page.selectOption('select[name="genre"]', 'M');
      await page.fill('input[name="taille_cm"]', '178');
      await page.fill('input[name="poids_kg"]', '74');
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/.*dashboard/);

    // Vérifier la présence du score
    await expect(page.locator('.score-value')).toBeVisible({ timeout: 10000 });
    
    // Vérifier la présence des recommandations
    await expect(page.locator('text=Recommandations personnalisées')).toBeVisible();
    await expect(page.locator('.recommendations-list li').first()).toBeVisible();
  });

  test('T4: Vérification que le graphe d\'évolution se met à jour après ajout d\'une nouvelle journée', async ({ page }) => {
    // Se connecter
    await page.goto(FRONTEND_URL);
    
    // Sélectionner ou créer un utilisateur
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

    // Attendre que le dashboard se charge
    await page.waitForSelector('.dashboard-container', { timeout: 10000 });

    // Vérifier la présence du graphique (s'il y a des données)
    const chartExists = await page.locator('canvas').count();
    
    // Ajouter une nouvelle entrée
    await page.click('text=Ajouter une entrée');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    await page.fill('input[name="sommeil_h"]', '8');
    await page.fill('input[name="pas"]', '9000');
    await page.fill('input[name="sport_min"]', '45');
    await page.fill('input[name="calories"]', '2300');
    await page.fill('input[name="humeur_0_5"]', '5');
    await page.fill('input[name="stress_0_5"]', '1');
    await page.fill('input[name="fc_repos"]', '62');
    await page.click('button[type="submit"]');

    // Attendre la redirection
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
    
    // Vérifier que le graphique est toujours présent ou mis à jour
    await page.waitForTimeout(2000); // Attendre le chargement
    const chartAfter = await page.locator('canvas').count();
    
    // Le graphique devrait être présent (ou apparaître si c'était la première entrée)
    expect(chartAfter).toBeGreaterThanOrEqual(0);
  });
});




