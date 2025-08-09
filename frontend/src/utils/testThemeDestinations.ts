// Test script for validating theme-based destination functionality

import { getTopCitiesForTheme, isThemeSupported, getCitiesForTheme } from '@/data/themeCities'
import { environmentService } from '@/config/environment'

export interface TestResult {
  testName: string
  success: boolean
  details: string
  data?: any
}

export class ThemeDestinationTester {
  
  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = []
    
    console.log('🧪 Running Theme Destination Tests...')
    
    // Test 1: Theme City Data Validation
    results.push(await this.testThemeCityData())
    
    // Test 2: Theme Support Validation
    results.push(await this.testThemeSupport())
    
    // Test 3: City Filtering by Theme
    results.push(await this.testCityFiltering())
    
    // Test 4: Environment Configuration
    results.push(await this.testEnvironmentConfig())
    
    // Test 5: Theme Score Validation
    results.push(await this.testThemeScores())
    
    console.log('✅ All theme destination tests completed')
    return results
  }

  private async testThemeCityData(): Promise<TestResult> {
    try {
      // Test each theme has cities
      const themes = ['party', 'adventure', 'learn', 'shopping', 'beach']
      const totalCities = new Set<string>()
      
      for (const theme of themes) {
        const cities = getTopCitiesForTheme(theme, 20)
        
        if (cities.length === 0) {
          return {
            testName: 'Theme City Data',
            success: false,
            details: `No cities found for theme: ${theme}`
          }
        }
        
        // Collect unique cities
        cities.forEach(city => totalCities.add(city.iataCode))
        
        // Validate city structure
        for (const city of cities.slice(0, 3)) {
          if (!city.iataCode || !city.cityName || !city.themeScores) {
            return {
              testName: 'Theme City Data',
              success: false,
              details: `Invalid city structure for ${city.cityName || 'unknown city'}`
            }
          }
          
          // Validate theme scores
          const requiredThemes = ['party', 'adventure', 'learn', 'shopping', 'beach']
          for (const requiredTheme of requiredThemes) {
            if (typeof city.themeScores[requiredTheme as keyof typeof city.themeScores] !== 'number') {
              return {
                testName: 'Theme City Data',
                success: false,
                details: `Missing or invalid theme score for ${requiredTheme} in ${city.cityName}`
              }
            }
          }
        }
      }
      
      return {
        testName: 'Theme City Data',
        success: true,
        details: `Found ${totalCities.size} unique cities across all themes`,
        data: { totalUniqueCities: totalCities.size, themes: themes.length }
      }
    } catch (error) {
      return {
        testName: 'Theme City Data',
        success: false,
        details: `Error during theme city data test: ${error}`
      }
    }
  }

  private async testThemeSupport(): Promise<TestResult> {
    try {
      const validThemes = ['party', 'adventure', 'learn', 'shopping', 'beach']
      const invalidThemes = ['invalid', 'test', 'unknown']
      
      // Test valid themes
      for (const theme of validThemes) {
        if (!isThemeSupported(theme)) {
          return {
            testName: 'Theme Support',
            success: false,
            details: `Valid theme ${theme} not supported`
          }
        }
      }
      
      // Test invalid themes
      for (const theme of invalidThemes) {
        if (isThemeSupported(theme)) {
          return {
            testName: 'Theme Support',
            success: false,
            details: `Invalid theme ${theme} incorrectly supported`
          }
        }
      }
      
      return {
        testName: 'Theme Support',
        success: true,
        details: `All ${validThemes.length} valid themes supported, ${invalidThemes.length} invalid themes rejected`,
        data: { validThemes, invalidThemes }
      }
    } catch (error) {
      return {
        testName: 'Theme Support',
        success: false,
        details: `Error during theme support test: ${error}`
      }
    }
  }

  private async testCityFiltering(): Promise<TestResult> {
    try {
      // Test different result limits
      const testCases = [
        { theme: 'party', limit: 5, expectedMin: 5 },
        { theme: 'adventure', limit: 10, expectedMin: 10 },
        { theme: 'shopping', limit: 15, expectedMin: 10 }, // May have fewer cities
        { theme: 'beach', limit: 3, expectedMin: 3 }
      ]
      
      for (const testCase of testCases) {
        const cities = getTopCitiesForTheme(testCase.theme, testCase.limit)
        
        if (cities.length < testCase.expectedMin) {
          return {
            testName: 'City Filtering',
            success: false,
            details: `Expected at least ${testCase.expectedMin} cities for ${testCase.theme}, got ${cities.length}`
          }
        }
        
        // Verify cities are sorted by theme score (descending)
        for (let i = 1; i < Math.min(cities.length, 5); i++) {
          const currentScore = cities[i].themeScores[testCase.theme as keyof typeof cities[i].themeScores]
          const prevScore = cities[i-1].themeScores[testCase.theme as keyof typeof cities[i-1].themeScores]
          
          if (currentScore > prevScore) {
            return {
              testName: 'City Filtering',
              success: false,
              details: `Cities not properly sorted by theme score for ${testCase.theme}`
            }
          }
        }
      }
      
      return {
        testName: 'City Filtering',
        success: true,
        details: `All city filtering tests passed for ${testCases.length} themes`,
        data: { testCases: testCases.length }
      }
    } catch (error) {
      return {
        testName: 'City Filtering',
        success: false,
        details: `Error during city filtering test: ${error}`
      }
    }
  }

  private async testEnvironmentConfig(): Promise<TestResult> {
    try {
      const config = environmentService.getConfig()
      
      // Test required configuration values
      const requiredConfigs = [
        { key: 'backendApiUrl', value: config.backendApiUrl },
        { key: 'supportedThemes', value: config.supportedThemes },
        { key: 'defaultTheme', value: config.defaultTheme },
        { key: 'maxDestinationResults', value: config.maxDestinationResults }
      ]
      
      for (const configItem of requiredConfigs) {
        if (!configItem.value || (Array.isArray(configItem.value) && configItem.value.length === 0)) {
          return {
            testName: 'Environment Config',
            success: false,
            details: `Missing or empty configuration: ${configItem.key}`
          }
        }
      }
      
      // Test theme validation
      if (!config.supportedThemes.includes(config.defaultTheme)) {
        return {
          testName: 'Environment Config',
          success: false,
          details: `Default theme ${config.defaultTheme} not in supported themes`
        }
      }
      
      // Test numeric constraints
      if (config.maxDestinationResults <= 0 || config.maxDestinationResults > 100) {
        return {
          testName: 'Environment Config',
          success: false,
          details: `Invalid maxDestinationResults: ${config.maxDestinationResults}`
        }
      }
      
      return {
        testName: 'Environment Config',
        success: true,
        details: `Environment configuration valid with ${config.supportedThemes.length} themes`,
        data: {
          supportedThemes: config.supportedThemes,
          defaultTheme: config.defaultTheme,
          maxResults: config.maxDestinationResults,
          backendEnabled: config.backendEnabled
        }
      }
    } catch (error) {
      return {
        testName: 'Environment Config',
        success: false,
        details: `Error during environment config test: ${error}`
      }
    }
  }

  private async testThemeScores(): Promise<TestResult> {
    try {
      const themes = ['party', 'adventure', 'learn', 'shopping', 'beach']
      const sampleCities = getTopCitiesForTheme('party', 10)
      
      if (sampleCities.length === 0) {
        return {
          testName: 'Theme Scores',
          success: false,
          details: 'No cities available for theme score testing'
        }
      }
      
      let totalScoreValidations = 0
      let validScores = 0
      
      for (const city of sampleCities.slice(0, 5)) {
        for (const theme of themes) {
          totalScoreValidations++
          const score = city.themeScores[theme as keyof typeof city.themeScores]
          
          // Validate score is number between 0-100
          if (typeof score === 'number' && score >= 0 && score <= 100) {
            validScores++
          }
        }
        
        // Validate city has at least one strong theme (>= 70)
        const maxScore = Math.max(...Object.values(city.themeScores))
        if (maxScore < 70) {
          return {
            testName: 'Theme Scores',
            success: false,
            details: `City ${city.cityName} has no strong theme scores (max: ${maxScore})`
          }
        }
      }
      
      const scoreValidityPercentage = (validScores / totalScoreValidations) * 100
      
      if (scoreValidityPercentage < 95) {
        return {
          testName: 'Theme Scores',
          success: false,
          details: `Only ${scoreValidityPercentage.toFixed(1)}% of scores are valid`
        }
      }
      
      return {
        testName: 'Theme Scores',
        success: true,
        details: `${scoreValidityPercentage.toFixed(1)}% of ${totalScoreValidations} theme scores are valid`,
        data: {
          totalValidations: totalScoreValidations,
          validScores,
          citiesTesd: sampleCities.length,
          themes: themes.length
        }
      }
    } catch (error) {
      return {
        testName: 'Theme Scores',
        success: false,
        details: `Error during theme scores test: ${error}`
      }
    }
  }

  // Helper method to generate test report
  generateReport(results: TestResult[]): string {
    const passed = results.filter(r => r.success).length
    const total = results.length
    const successRate = (passed / total) * 100
    
    let report = `\n🧪 Theme Destination Test Report\n`
    report += `${'='.repeat(50)}\n`
    report += `Overall: ${passed}/${total} tests passed (${successRate.toFixed(1)}%)\n\n`
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      report += `${status} ${result.testName}: ${result.details}\n`
      if (result.data) {
        report += `   Data: ${JSON.stringify(result.data)}\n`
      }
      report += '\n'
    })
    
    return report
  }
}

// Export test runner function for easy usage
export async function runThemeDestinationTests(): Promise<TestResult[]> {
  const tester = new ThemeDestinationTester()
  return await tester.runAllTests()
}

export async function generateTestReport(): Promise<string> {
  const tester = new ThemeDestinationTester()
  const results = await tester.runAllTests()
  return tester.generateReport(results)
}