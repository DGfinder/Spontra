package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/olivere/elastic/v7"
)

// Airport represents airport data for Elasticsearch
type Airport struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	City        string `json:"city"`
	Country     string `json:"country"`
	CountryCode string `json:"country_code"`
	Type        string `json:"type"`
}

// European airports data for search suggestions
var europeanAirports = []Airport{
	// UK & Ireland
	{"LHR", "London Heathrow Airport", "London", "United Kingdom", "GB", "airport"},
	{"LGW", "London Gatwick Airport", "London", "United Kingdom", "GB", "airport"},
	{"STN", "London Stansted Airport", "London", "United Kingdom", "GB", "airport"},
	{"LTN", "London Luton Airport", "London", "United Kingdom", "GB", "airport"},
	{"MAN", "Manchester Airport", "Manchester", "United Kingdom", "GB", "airport"},
	{"EDI", "Edinburgh Airport", "Edinburgh", "United Kingdom", "GB", "airport"},
	{"GLA", "Glasgow Airport", "Glasgow", "United Kingdom", "GB", "airport"},
	{"BHX", "Birmingham Airport", "Birmingham", "United Kingdom", "GB", "airport"},
	{"LPL", "Liverpool John Lennon Airport", "Liverpool", "United Kingdom", "GB", "airport"},
	{"NCL", "Newcastle Airport", "Newcastle", "United Kingdom", "GB", "airport"},
	{"DUB", "Dublin Airport", "Dublin", "Ireland", "IE", "airport"},
	{"ORK", "Cork Airport", "Cork", "Ireland", "IE", "airport"},
	
	// France
	{"CDG", "Charles de Gaulle Airport", "Paris", "France", "FR", "airport"},
	{"ORY", "Paris Orly Airport", "Paris", "France", "FR", "airport"},
	{"NCE", "Nice Côte d'Azur Airport", "Nice", "France", "FR", "airport"},
	{"LYS", "Lyon Saint-Exupéry Airport", "Lyon", "France", "FR", "airport"},
	{"MRS", "Marseille Provence Airport", "Marseille", "France", "FR", "airport"},
	{"TLS", "Toulouse-Blagnac Airport", "Toulouse", "France", "FR", "airport"},
	{"NTE", "Nantes Atlantique Airport", "Nantes", "France", "FR", "airport"},
	{"BOD", "Bordeaux-Mérignac Airport", "Bordeaux", "France", "FR", "airport"},
	{"LIL", "Lille Airport", "Lille", "France", "FR", "airport"},
	{"SXB", "Strasbourg Airport", "Strasbourg", "France", "FR", "airport"},
	
	// Germany
	{"FRA", "Frankfurt Airport", "Frankfurt", "Germany", "DE", "airport"},
	{"MUC", "Munich Airport", "Munich", "Germany", "DE", "airport"},
	{"BER", "Berlin Brandenburg Airport", "Berlin", "Germany", "DE", "airport"},
	{"DUS", "Düsseldorf Airport", "Düsseldorf", "Germany", "DE", "airport"},
	{"HAM", "Hamburg Airport", "Hamburg", "Germany", "DE", "airport"},
	{"CGN", "Cologne Bonn Airport", "Cologne", "Germany", "DE", "airport"},
	{"STR", "Stuttgart Airport", "Stuttgart", "Germany", "DE", "airport"},
	{"HAJ", "Hannover Airport", "Hannover", "Germany", "DE", "airport"},
	{"NUE", "Nuremberg Airport", "Nuremberg", "Germany", "DE", "airport"},
	{"LEJ", "Leipzig/Halle Airport", "Leipzig", "Germany", "DE", "airport"},
	
	// Spain
	{"MAD", "Madrid-Barajas Airport", "Madrid", "Spain", "ES", "airport"},
	{"BCN", "Barcelona-El Prat Airport", "Barcelona", "Spain", "ES", "airport"},
	{"PMI", "Palma de Mallorca Airport", "Palma", "Spain", "ES", "airport"},
	{"SVQ", "Sevilla Airport", "Seville", "Spain", "ES", "airport"},
	{"VLC", "Valencia Airport", "Valencia", "Spain", "ES", "airport"},
	{"BIO", "Bilbao Airport", "Bilbao", "Spain", "ES", "airport"},
	{"AGP", "Málaga Airport", "Málaga", "Spain", "ES", "airport"},
	{"LPA", "Las Palmas Airport", "Las Palmas", "Spain", "ES", "airport"},
	{"TFS", "Tenerife South Airport", "Tenerife", "Spain", "ES", "airport"},
	{"ALC", "Alicante Airport", "Alicante", "Spain", "ES", "airport"},
	
	// Italy
	{"FCO", "Rome Fiumicino Airport", "Rome", "Italy", "IT", "airport"},
	{"MXP", "Milan Malpensa Airport", "Milan", "Italy", "IT", "airport"},
	{"LIN", "Milan Linate Airport", "Milan", "Italy", "IT", "airport"},
	{"NAP", "Naples Airport", "Naples", "Italy", "IT", "airport"},
	{"VCE", "Venice Marco Polo Airport", "Venice", "Italy", "IT", "airport"},
	{"BGY", "Milan Bergamo Airport", "Bergamo", "Italy", "IT", "airport"},
	{"BLQ", "Bologna Airport", "Bologna", "Italy", "IT", "airport"},
	{"FLR", "Florence Airport", "Florence", "Italy", "IT", "airport"},
	{"PSA", "Pisa Airport", "Pisa", "Italy", "IT", "airport"},
	{"CTA", "Catania Airport", "Catania", "Italy", "IT", "airport"},
	
	// Netherlands
	{"AMS", "Amsterdam Schiphol Airport", "Amsterdam", "Netherlands", "NL", "airport"},
	{"EIN", "Eindhoven Airport", "Eindhoven", "Netherlands", "NL", "airport"},
	{"RTM", "Rotterdam The Hague Airport", "Rotterdam", "Netherlands", "NL", "airport"},
	{"GRQ", "Groningen Airport Eelde", "Groningen", "Netherlands", "NL", "airport"},
	
	// Belgium
	{"BRU", "Brussels Airport", "Brussels", "Belgium", "BE", "airport"},
	{"CRL", "Brussels South Charleroi Airport", "Charleroi", "Belgium", "BE", "airport"},
	{"ANR", "Antwerp Airport", "Antwerp", "Belgium", "BE", "airport"},
	{"LGG", "Liège Airport", "Liège", "Belgium", "BE", "airport"},
	
	// Switzerland
	{"ZUR", "Zurich Airport", "Zurich", "Switzerland", "CH", "airport"},
	{"GVA", "Geneva Airport", "Geneva", "Switzerland", "CH", "airport"},
	{"BSL", "Basel-Mulhouse-Freiburg Airport", "Basel", "Switzerland", "CH", "airport"},
	{"BRN", "Bern Airport", "Bern", "Switzerland", "CH", "airport"},
	
	// Austria
	{"VIE", "Vienna International Airport", "Vienna", "Austria", "AT", "airport"},
	{"SZG", "Salzburg Airport", "Salzburg", "Austria", "AT", "airport"},
	{"INN", "Innsbruck Airport", "Innsbruck", "Austria", "AT", "airport"},
	{"GRZ", "Graz Airport", "Graz", "Austria", "AT", "airport"},
	
	// Scandinavia
	{"ARN", "Stockholm Arlanda Airport", "Stockholm", "Sweden", "SE", "airport"},
	{"CPH", "Copenhagen Airport", "Copenhagen", "Denmark", "DK", "airport"},
	{"OSL", "Oslo Gardermoen Airport", "Oslo", "Norway", "NO", "airport"},
	{"HEL", "Helsinki-Vantaa Airport", "Helsinki", "Finland", "FI", "airport"},
	{"GOT", "Gothenburg-Landvetter Airport", "Gothenburg", "Sweden", "SE", "airport"},
	{"STO", "Stockholm Bromma Airport", "Stockholm", "Sweden", "SE", "airport"},
	{"AAL", "Aalborg Airport", "Aalborg", "Denmark", "DK", "airport"},
	{"BGO", "Bergen Airport", "Bergen", "Norway", "NO", "airport"},
	{"TRD", "Trondheim Airport", "Trondheim", "Norway", "NO", "airport"},
	{"TMP", "Tampere-Pirkkala Airport", "Tampere", "Finland", "FI", "airport"},
	
	// Eastern Europe
	{"WAW", "Warsaw Chopin Airport", "Warsaw", "Poland", "PL", "airport"},
	{"KRK", "Kraków Airport", "Kraków", "Poland", "PL", "airport"},
	{"GDN", "Gdańsk Airport", "Gdańsk", "Poland", "PL", "airport"},
	{"WRO", "Wrocław Airport", "Wrocław", "Poland", "PL", "airport"},
	{"PRG", "Prague Václav Havel Airport", "Prague", "Czech Republic", "CZ", "airport"},
	{"BUD", "Budapest Ferenc Liszt Airport", "Budapest", "Hungary", "HU", "airport"},
	{"OTP", "Bucharest Henri Coandă Airport", "Bucharest", "Romania", "RO", "airport"},
	{"CLJ", "Cluj-Napoca Airport", "Cluj-Napoca", "Romania", "RO", "airport"},
	{"BTS", "Bratislava Airport", "Bratislava", "Slovakia", "SK", "airport"},
	{"SOF", "Sofia Airport", "Sofia", "Bulgaria", "BG", "airport"},
	
	// Portugal
	{"LIS", "Lisbon Portela Airport", "Lisbon", "Portugal", "PT", "airport"},
	{"OPO", "Porto Airport", "Porto", "Portugal", "PT", "airport"},
	{"FAO", "Faro Airport", "Faro", "Portugal", "PT", "airport"},
	{"FNC", "Madeira Airport", "Funchal", "Portugal", "PT", "airport"},
	
	// Greece
	{"ATH", "Athens Eleftherios Venizelos Airport", "Athens", "Greece", "GR", "airport"},
	{"SKG", "Thessaloniki Airport", "Thessaloniki", "Greece", "GR", "airport"},
	{"HER", "Heraklion Airport", "Heraklion", "Greece", "GR", "airport"},
	{"RHO", "Rhodes Airport", "Rhodes", "Greece", "GR", "airport"},
	{"CFU", "Corfu Airport", "Corfu", "Greece", "GR", "airport"},
	{"JTR", "Santorini Airport", "Santorini", "Greece", "GR", "airport"},
	
	// Turkey (European part)
	{"IST", "Istanbul Airport", "Istanbul", "Turkey", "TR", "airport"},
	{"SAW", "Sabiha Gökçen Airport", "Istanbul", "Turkey", "TR", "airport"},
	
	// Croatia
	{"ZAG", "Zagreb Airport", "Zagreb", "Croatia", "HR", "airport"},
	{"SPU", "Split Airport", "Split", "Croatia", "HR", "airport"},
	{"DBV", "Dubrovnik Airport", "Dubrovnik", "Croatia", "HR", "airport"},
	{"PUY", "Pula Airport", "Pula", "Croatia", "HR", "airport"},
	
	// Slovenia
	{"LJU", "Ljubljana Jože Pučnik Airport", "Ljubljana", "Slovenia", "SI", "airport"},
	{"MBX", "Maribor Airport", "Maribor", "Slovenia", "SI", "airport"},
	
	// Baltic States
	{"RIX", "Riga Airport", "Riga", "Latvia", "LV", "airport"},
	{"TLL", "Tallinn Airport", "Tallinn", "Estonia", "EE", "airport"},
	{"VNO", "Vilnius Airport", "Vilnius", "Lithuania", "LT", "airport"},
	{"KUN", "Kaunas Airport", "Kaunas", "Lithuania", "LT", "airport"},
	
	// Iceland
	{"KEF", "Keflavík International Airport", "Reykjavik", "Iceland", "IS", "airport"},
	{"RKV", "Reykjavik Airport", "Reykjavik", "Iceland", "IS", "airport"},
	
	// Malta
	{"MLA", "Malta International Airport", "Valletta", "Malta", "MT", "airport"},
	
	// Cyprus
	{"LCA", "Larnaca Airport", "Larnaca", "Cyprus", "CY", "airport"},
	{"PFO", "Paphos Airport", "Paphos", "Cyprus", "CY", "airport"},
}

func main() {
	// Get Elasticsearch URL from environment or use default
	elasticsearchURL := os.Getenv("ELASTICSEARCH_URL")
	if elasticsearchURL == "" {
		elasticsearchURL = "http://localhost:9200"
	}

	// Create Elasticsearch client
	client, err := elastic.NewClient(
		elastic.SetURL(elasticsearchURL),
		elastic.SetSniff(false),
	)
	if err != nil {
		log.Fatal("Failed to create Elasticsearch client:", err)
	}

	// Test connection
	info, code, err := client.Ping(elasticsearchURL).Do(context.Background())
	if err != nil {
		log.Fatal("Failed to ping Elasticsearch:", err)
	}
	log.Printf("Elasticsearch connection successful (code %d): %s", code, info.Version.Number)

	// Create airport index
	indexName := "spontra_airports"
	if err := createAirportIndex(client, indexName); err != nil {
		log.Fatal("Failed to create airport index:", err)
	}

	// Populate airport data
	if err := populateAirportData(client, indexName); err != nil {
		log.Fatal("Failed to populate airport data:", err)
	}

	log.Println("Airport data populated successfully!")
}

// createAirportIndex creates the airport index with proper mapping
func createAirportIndex(client *elastic.Client, indexName string) error {
	// Check if index exists
	exists, err := client.IndexExists(indexName).Do(context.Background())
	if err != nil {
		return err
	}

	if exists {
		log.Printf("Index %s already exists, deleting...", indexName)
		_, err := client.DeleteIndex(indexName).Do(context.Background())
		if err != nil {
			return err
		}
	}

	// Create index with mapping
	mapping := `{
		"settings": {
			"number_of_shards": 1,
			"number_of_replicas": 1,
			"analysis": {
				"analyzer": {
					"standard_folding": {
						"type": "custom",
						"tokenizer": "standard",
						"filter": ["lowercase", "asciifolding"]
					}
				}
			}
		},
		"mappings": {
			"properties": {
				"code": {"type": "keyword"},
				"name": {"type": "text", "analyzer": "standard_folding"},
				"city": {"type": "text", "analyzer": "standard_folding"},
				"country": {"type": "text", "analyzer": "standard_folding"},
				"country_code": {"type": "keyword"},
				"type": {"type": "keyword"}
			}
		}
	}`

	createIndex, err := client.CreateIndex(indexName).Body(mapping).Do(context.Background())
	if err != nil {
		return err
	}

	log.Printf("Created index %s (acknowledged: %t)", indexName, createIndex.Acknowledged)
	return nil
}

// populateAirportData indexes all airport data
func populateAirportData(client *elastic.Client, indexName string) error {
	log.Printf("Indexing %d airports...", len(europeanAirports))

	// Use bulk indexer for better performance
	bulkRequest := client.Bulk()

	for _, airport := range europeanAirports {
		req := elastic.NewBulkIndexRequest().
			Index(indexName).
			Id(airport.Code).
			Doc(airport)
		bulkRequest = bulkRequest.Add(req)
	}

	bulkResponse, err := bulkRequest.Do(context.Background())
	if err != nil {
		return err
	}

	if bulkResponse.Errors {
		for _, item := range bulkResponse.Items {
			for action, result := range item {
				if result.Error != nil {
					log.Printf("Error indexing %s %s: %s", action, result.Id, result.Error.Reason)
				}
			}
		}
	}

	log.Printf("Successfully indexed %d airports", len(bulkResponse.Items))
	return nil
}

// Test search functionality
func testSearch(client *elastic.Client, indexName string) error {
	log.Println("Testing airport search...")

	// Test search for "London"
	query := elastic.NewMultiMatchQuery("London", "code^3", "name^2", "city^2", "country").
		Type("best_fields").
		Fuzziness("AUTO")

	searchResult, err := client.Search().
		Index(indexName).
		Query(query).
		Size(5).
		Sort("_score", false).
		Do(context.Background())

	if err != nil {
		return err
	}

	log.Printf("Search for 'London' returned %d results:", len(searchResult.Hits.Hits))
	for _, hit := range searchResult.Hits.Hits {
		var airport Airport
		if err := json.Unmarshal(hit.Source, &airport); err == nil {
			log.Printf("  - %s: %s (%s) - Score: %.2f", airport.Code, airport.Name, airport.City, *hit.Score)
		}
	}

	return nil
}