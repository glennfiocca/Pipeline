import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Profile, insertProfileSchema, type InsertProfile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Calendar, Award, Globe, Code } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import React from 'react';

// Add file state management
interface FileState {
  resume?: File;
  transcript?: File;
}

// Add this interface outside of all components
interface University {
  code: string;
  name: string;
}

// Add a constant array of universities that can be used throughout the component
const UNIVERSITIES: University[] = [
  { code: "none", name: "-- Select university/college --" },
  // Ivy League
  { code: "harvard", name: "Harvard University" },
  { code: "yale", name: "Yale University" },
  { code: "princeton", name: "Princeton University" },
  { code: "upenn", name: "University of Pennsylvania" },
  { code: "columbia", name: "Columbia University" },
  { code: "brown", name: "Brown University" },
  { code: "dartmouth", name: "Dartmouth College" },
  { code: "cornell", name: "Cornell University" },
  
  // Top Private Research Universities
  { code: "stanford", name: "Stanford University" },
  { code: "mit", name: "Massachusetts Institute of Technology" },
  { code: "caltech", name: "California Institute of Technology" },
  { code: "uchicago", name: "University of Chicago" },
  { code: "jhu", name: "Johns Hopkins University" },
  { code: "northwestern", name: "Northwestern University" },
  { code: "duke", name: "Duke University" },
  { code: "vanderbilt", name: "Vanderbilt University" },
  { code: "rice", name: "Rice University" },
  { code: "wustl", name: "Washington University in St. Louis" },
  { code: "emory", name: "Emory University" },
  { code: "usc", name: "University of Southern California" },
  { code: "nyu", name: "New York University" },
  { code: "georgetown", name: "Georgetown University" },
  { code: "nd", name: "University of Notre Dame" },
  { code: "bu", name: "Boston University" },
  { code: "tufts", name: "Tufts University" },
  { code: "bc", name: "Boston College" },
  { code: "brandeis", name: "Brandeis University" },
  { code: "carnegie", name: "Carnegie Mellon University" },
  { code: "case", name: "Case Western Reserve University" },
  { code: "tulane", name: "Tulane University" },
  { code: "northeastern", name: "Northeastern University" },
  { code: "gwu", name: "George Washington University" },
  { code: "american", name: "American University" },
  { code: "syracuse", name: "Syracuse University" },
  { code: "fordham", name: "Fordham University" },
  { code: "pepperdine", name: "Pepperdine University" },
  { code: "smu", name: "Southern Methodist University" },
  { code: "wakeforest", name: "Wake Forest University" },
  { code: "lehigh", name: "Lehigh University" },
  { code: "villanova", name: "Villanova University" },
  { code: "miami", name: "University of Miami" },
  { code: "rochester", name: "University of Rochester" },
  { code: "marquette", name: "Marquette University" },
  { code: "baylor", name: "Baylor University" },
  { code: "slu", name: "Saint Louis University" },
  { code: "tcu", name: "Texas Christian University" },
  { code: "drexel", name: "Drexel University" },
  { code: "rit", name: "Rochester Institute of Technology" },
  { code: "elon", name: "Elon University" },
  
  // Top Public Universities
  { code: "berkeley", name: "University of California, Berkeley" },
  { code: "ucla", name: "University of California, Los Angeles" },
  { code: "umich", name: "University of Michigan" },
  { code: "uva", name: "University of Virginia" },
  { code: "unc", name: "University of North Carolina at Chapel Hill" },
  { code: "ucsd", name: "University of California, San Diego" },
  { code: "ucdavis", name: "University of California, Davis" },
  { code: "ucsb", name: "University of California, Santa Barbara" },
  { code: "ucsc", name: "University of California, Santa Cruz" },
  { code: "uci", name: "University of California, Irvine" },
  { code: "ucr", name: "University of California, Riverside" },
  { code: "ucm", name: "University of California, Merced" },
  { code: "ucsf", name: "University of California, San Francisco" },
  { code: "gatech", name: "Georgia Institute of Technology" },
  { code: "utaustin", name: "University of Texas at Austin" },
  { code: "illinois", name: "University of Illinois Urbana-Champaign" },
  { code: "wisc", name: "University of Wisconsin-Madison" },
  { code: "uw", name: "University of Washington" },
  { code: "osu", name: "Ohio State University" },
  { code: "psu", name: "Pennsylvania State University" },
  { code: "purdue", name: "Purdue University" },
  { code: "umd", name: "University of Maryland" },
  { code: "ufl", name: "University of Florida" },
  { code: "uga", name: "University of Georgia" },
  { code: "umn", name: "University of Minnesota" },
  { code: "rutgers", name: "Rutgers University" },
  { code: "indiana", name: "Indiana University Bloomington" },
  { code: "iowau", name: "University of Iowa" },
  { code: "tamu", name: "Texas A&M University" },
  { code: "uconn", name: "University of Connecticut" },
  { code: "msu", name: "Michigan State University" },
  { code: "vt", name: "Virginia Tech" },
  { code: "asu", name: "Arizona State University" },
  { code: "colostate", name: "Colorado State University" },
  { code: "cudenver", name: "University of Colorado Denver" },
  { code: "cuboulder", name: "University of Colorado Boulder" },
  { code: "fsu", name: "Florida State University" },
  { code: "ucf", name: "University of Central Florida" },
  { code: "usf", name: "University of South Florida" },
  { code: "ncstate", name: "North Carolina State University" },
  
  // Liberal Arts Colleges
  { code: "williams", name: "Williams College" },
  { code: "amherst", name: "Amherst College" },
  { code: "swarthmore", name: "Swarthmore College" },
  { code: "pomona", name: "Pomona College" },
  { code: "wellesley", name: "Wellesley College" },
  { code: "bowdoin", name: "Bowdoin College" },
  { code: "middlebury", name: "Middlebury College" },
  { code: "carleton", name: "Carleton College" },
  { code: "claremont", name: "Claremont McKenna College" },
  { code: "davidson", name: "Davidson College" },
  { code: "haverford", name: "Haverford College" },
  { code: "washington", name: "Washington and Lee University" },
  { code: "vassar", name: "Vassar College" },
  { code: "colgate", name: "Colgate University" },
  { code: "colby", name: "Colby College" },
  { code: "wesleyan", name: "Wesleyan University" },
  { code: "hamilton", name: "Hamilton College" },
  { code: "grinnell", name: "Grinnell College" },
  { code: "barnard", name: "Barnard College" },
  { code: "bates", name: "Bates College" },
  { code: "kenyon", name: "Kenyon College" },
  { code: "macalester", name: "Macalester College" },
  { code: "oberlin", name: "Oberlin College" },
  { code: "bucknell", name: "Bucknell University" },
  { code: "lafayette", name: "Lafayette College" },
  { code: "bryn", name: "Bryn Mawr College" },
  { code: "smith", name: "Smith College" },
  { code: "mount", name: "Mount Holyoke College" },
  { code: "trinity", name: "Trinity College" },
  { code: "gettysburg", name: "Gettysburg College" },
  { code: "occidental", name: "Occidental College" },
  { code: "dickinson", name: "Dickinson College" },
  { code: "reed", name: "Reed College" },
  { code: "skidmore", name: "Skidmore College" },
  { code: "colby-sawyer", name: "Colby-Sawyer College" },
  { code: "soka", name: "Soka University of America" },
  { code: "scripps", name: "Scripps College" },
  { code: "pitzer", name: "Pitzer College" },
  { code: "whitman", name: "Whitman College" },
  { code: "connection", name: "Connecticut College" },
  
  // Technical Institutes
  { code: "rpi", name: "Rensselaer Polytechnic Institute" },
  { code: "wpi", name: "Worcester Polytechnic Institute" },
  { code: "stevens", name: "Stevens Institute of Technology" },
  { code: "njit", name: "New Jersey Institute of Technology" },
  { code: "fit", name: "Florida Institute of Technology" },
  { code: "kettering", name: "Kettering University" },
  { code: "mines", name: "Colorado School of Mines" },
  { code: "rose-hulman", name: "Rose-Hulman Institute of Technology" },
  { code: "harvey", name: "Harvey Mudd College" },
  { code: "msoe", name: "Milwaukee School of Engineering" },
  { code: "lawrence", name: "Lawrence Technological University" },
  { code: "poly", name: "SUNY Polytechnic Institute" },
  
  // HBCUs and Minority-Serving Institutions
  { code: "howard", name: "Howard University" },
  { code: "spelman", name: "Spelman College" },
  { code: "morehouse", name: "Morehouse College" },
  { code: "xavier", name: "Xavier University of Louisiana" },
  { code: "hampton", name: "Hampton University" },
  { code: "famu", name: "Florida A&M University" },
  { code: "nca&t", name: "North Carolina A&T State University" },
  { code: "tuskegee", name: "Tuskegee University" },
  { code: "claflin", name: "Claflin University" },
  { code: "dillard", name: "Dillard University" },
  { code: "clark", name: "Clark Atlanta University" },
  { code: "morgan", name: "Morgan State University" },
  { code: "alcorn", name: "Alcorn State University" },
  { code: "fisk", name: "Fisk University" },
  { code: "morris", name: "Morris College" },
  { code: "huston", name: "Huston-Tillotson University" },
  { code: "unm", name: "University of New Mexico" },
  { code: "nmsu", name: "New Mexico State University" },
  { code: "utep", name: "University of Texas at El Paso" },
  { code: "fiu", name: "Florida International University" },
  
  // State Universities (Additional)
  { code: "iowa-state", name: "Iowa State University" },
  { code: "ksu", name: "Kansas State University" },
  { code: "ku", name: "University of Kansas" },
  { code: "okstate", name: "Oklahoma State University" },
  { code: "ou", name: "University of Oklahoma" },
  { code: "uark", name: "University of Arkansas" },
  { code: "ky", name: "University of Kentucky" },
  { code: "louisville", name: "University of Louisville" },
  { code: "lsu", name: "Louisiana State University" },
  { code: "ole-miss", name: "University of Mississippi" },
  { code: "msstate", name: "Mississippi State University" },
  { code: "alabama", name: "University of Alabama" },
  { code: "auburn", name: "Auburn University" },
  { code: "usc-columbia", name: "University of South Carolina" },
  { code: "clemson", name: "Clemson University" },
  { code: "tennessee", name: "University of Tennessee" },
  { code: "wvu", name: "West Virginia University" },
  { code: "maine", name: "University of Maine" },
  { code: "unh", name: "University of New Hampshire" },
  { code: "uvt", name: "University of Vermont" },
  { code: "uri", name: "University of Rhode Island" },
  { code: "udel", name: "University of Delaware" },
  { code: "umassamherst", name: "University of Massachusetts Amherst" },
  { code: "umassboston", name: "University of Massachusetts Boston" },
  { code: "umasslowell", name: "University of Massachusetts Lowell" },
  { code: "suny-albany", name: "SUNY Albany" },
  { code: "suny-binghamton", name: "SUNY Binghamton" },
  { code: "suny-buffalo", name: "SUNY Buffalo" },
  { code: "suny-stony", name: "SUNY Stony Brook" },
  { code: "temple", name: "Temple University" },
  { code: "pitt", name: "University of Pittsburgh" },
  { code: "duquesne", name: "Duquesne University" },
  { code: "gmu", name: "George Mason University" },
  { code: "vcu", name: "Virginia Commonwealth University" },
  { code: "wm", name: "College of William & Mary" },
  { code: "jmu", name: "James Madison University" },
  { code: "odu", name: "Old Dominion University" },
  { code: "ull", name: "University of Louisiana at Lafayette" },
  { code: "utah", name: "University of Utah" },
  { code: "usu", name: "Utah State University" },
  { code: "unlv", name: "University of Nevada, Las Vegas" },
  { code: "unr", name: "University of Nevada, Reno" },
  { code: "ua", name: "University of Arizona" },
  { code: "nau", name: "Northern Arizona University" },
  { code: "unm", name: "University of New Mexico" },
  { code: "hawaii", name: "University of Hawaii" },
  { code: "wwu", name: "Western Washington University" },
  { code: "cwu", name: "Central Washington University" },
  { code: "ewu", name: "Eastern Washington University" },
  { code: "wsu", name: "Washington State University" },
  { code: "ui", name: "University of Idaho" },
  { code: "mtu", name: "Michigan Technological University" },
  { code: "wayne", name: "Wayne State University" },
  { code: "cmu-mi", name: "Central Michigan University" },
  { code: "wmu", name: "Western Michigan University" },
  { code: "emu", name: "Eastern Michigan University" },
  { code: "uic", name: "University of Illinois Chicago" },
  { code: "siu", name: "Southern Illinois University" },
  { code: "niu", name: "Northern Illinois University" },
  { code: "eiu", name: "Eastern Illinois University" },
  { code: "wiu", name: "Western Illinois University" },
  { code: "ohio", name: "Ohio University" },
  { code: "kent", name: "Kent State University" },
  { code: "bgsu", name: "Bowling Green State University" },
  { code: "miami-oh", name: "Miami University (Ohio)" },
  { code: "uc", name: "University of Cincinnati" },
  { code: "toledo", name: "University of Toledo" },
  { code: "uakron", name: "University of Akron" },
  { code: "missouri", name: "University of Missouri" },
  { code: "mizzou", name: "University of Missouri-Columbia" },
  { code: "umkc", name: "University of Missouri-Kansas City" },
  { code: "umsl", name: "University of Missouri-St. Louis" },
  { code: "semo", name: "Southeast Missouri State University" },
  { code: "ucr", name: "University of California, Riverside" },
  { code: "ucm", name: "University of California, Merced" },
  { code: "sdsu", name: "San Diego State University" },
  { code: "sfsu", name: "San Francisco State University" },
  { code: "fullerton", name: "California State University, Fullerton" },
  { code: "csula", name: "California State University, Los Angeles" },
  { code: "csun", name: "California State University, Northridge" },
  { code: "csulb", name: "California State University, Long Beach" },
  { code: "sjsu", name: "San Jose State University" },
  { code: "chico", name: "California State University, Chico" },
  { code: "csusb", name: "California State University, San Bernardino" },
  { code: "uvm", name: "University of Vermont" },
  { code: "csu", name: "Colorado State University" },
  { code: "ucdavis", name: "University of California, Davis" },
  { code: "ucsc", name: "University of California, Santa Cruz" },
  { code: "fresno", name: "California State University, Fresno" },
  { code: "cpp", name: "California State Polytechnic University, Pomona" },
  { code: "calpoly", name: "California Polytechnic State University" },
  { code: "montana", name: "University of Montana" },
  { code: "oregonstate", name: "Oregon State University" },
  { code: "uoregon", name: "University of Oregon" },
  { code: "psu-up", name: "Penn State University Park" },
  { code: "bsu", name: "Boise State University" },
  { code: "txst", name: "Texas State University" },
  { code: "unt", name: "University of North Texas" },
  { code: "uh", name: "University of Houston" },
  { code: "ttu", name: "Texas Tech University" },
  { code: "uwyo", name: "University of Wyoming" },
  { code: "fgcu", name: "Florida Gulf Coast University" },
  { code: "fau", name: "Florida Atlantic University" },
  { code: "unf", name: "University of North Florida" },
  { code: "aum", name: "Auburn University at Montgomery" },
  { code: "uab", name: "University of Alabama at Birmingham" },
  { code: "ua-huntsville", name: "University of Alabama in Huntsville" },
  { code: "uta", name: "University of Texas at Arlington" },
  { code: "utd", name: "University of Texas at Dallas" },
  { code: "umaine", name: "University of Maine" },
  { code: "uwm", name: "University of Wisconsin-Milwaukee" },
  
  // Community Colleges and City Universities
  { code: "cuny-baruch", name: "CUNY Baruch College" },
  { code: "cuny-hunter", name: "CUNY Hunter College" },
  { code: "cuny-city", name: "CUNY City College" },
  { code: "cuny-brooklyn", name: "CUNY Brooklyn College" },
  { code: "cuny-queens", name: "CUNY Queens College" },
  { code: "cuny-john-jay", name: "CUNY John Jay College" },
  { code: "cuny-lehman", name: "CUNY Lehman College" },
  { code: "cuny-csi", name: "CUNY College of Staten Island" },
  { code: "cuny-bmcc", name: "CUNY Borough of Manhattan Community College" },
  { code: "cuny-laguardia", name: "CUNY LaGuardia Community College" },
  { code: "santa-monica", name: "Santa Monica College" },
  { code: "de-anza", name: "De Anza College" },
  { code: "foothill", name: "Foothill College" },
  { code: "pasadena", name: "Pasadena City College" },
  { code: "valencia", name: "Valencia College" },
  { code: "miami-dade", name: "Miami Dade College" },
  { code: "broward", name: "Broward College" },
  { code: "northern-virginia", name: "Northern Virginia Community College" },
  { code: "houston-cc", name: "Houston Community College" },
  { code: "austin-cc", name: "Austin Community College" },
  { code: "columbus-state", name: "Columbus State Community College" },
  { code: "seattle-central", name: "Seattle Central College" },
  { code: "bellevue", name: "Bellevue College" },
  { code: "portland-cc", name: "Portland Community College" },
  { code: "montgomery", name: "Montgomery College" },
  { code: "monroe", name: "Monroe Community College" },
  { code: "oakton", name: "Oakton Community College" },
  { code: "harper", name: "Harper College" },
  { code: "ccp", name: "Community College of Philadelphia" },
  { code: "saddleback", name: "Saddleback College" },
  { code: "irvine-valley", name: "Irvine Valley College" },
  { code: "mira-costa", name: "MiraCosta College" },
  { code: "phoenix", name: "Phoenix College" },
  { code: "maricopa", name: "Maricopa Community Colleges" },
  
  // Faith-Based and Religious Colleges
  { code: "byu", name: "Brigham Young University" },
  { code: "liberty", name: "Liberty University" },
  { code: "plu", name: "Pacific Lutheran University" },
  { code: "spu", name: "Seattle Pacific University" },
  { code: "luc", name: "Loyola University Chicago" },
  { code: "pepperdine", name: "Pepperdine University" },
  { code: "smu", name: "Southern Methodist University" },
  { code: "baylor", name: "Baylor University" },
  { code: "tcu", name: "Texas Christian University" },
  { code: "gonzaga", name: "Gonzaga University" },
  { code: "creighton", name: "Creighton University" },
  { code: "lmu", name: "Loyola Marymount University" },
  { code: "duquesne", name: "Duquesne University" },
  { code: "villanova", name: "Villanova University" },
  { code: "seton-hall", name: "Seton Hall University" },
  { code: "providence", name: "Providence College" },
  { code: "fairfield", name: "Fairfield University" },
  { code: "calvin", name: "Calvin University" },
  { code: "wheaton", name: "Wheaton College" },
  { code: "biola", name: "Biola University" },
  { code: "regent", name: "Regent University" },
  { code: "oral-roberts", name: "Oral Roberts University" },
  { code: "samford", name: "Samford University" },
  
  // Art, Music, and Design Schools
  { code: "risd", name: "Rhode Island School of Design" },
  { code: "parsons", name: "Parsons School of Design" },
  { code: "pratt", name: "Pratt Institute" },
  { code: "saic", name: "School of the Art Institute of Chicago" },
  { code: "calarts", name: "California Institute of the Arts" },
  { code: "cca", name: "California College of the Arts" },
  { code: "scad", name: "Savannah College of Art and Design" },
  { code: "ringling", name: "Ringling College of Art and Design" },
  { code: "otis", name: "Otis College of Art and Design" },
  { code: "juilliard", name: "The Juilliard School" },
  { code: "berklee", name: "Berklee College of Music" },
  { code: "eastman", name: "Eastman School of Music" },
  { code: "manhattan", name: "Manhattan School of Music" },
  { code: "peabody", name: "Peabody Institute" },
  { code: "oberlin-con", name: "Oberlin Conservatory of Music" },
  
  // Business, Law, and Medical Schools (as standalone institutions)
  { code: "wharton", name: "Wharton School - University of Pennsylvania" },
  { code: "harvard-business", name: "Harvard Business School" },
  { code: "harvard-law", name: "Harvard Law School" },
  { code: "harvard-medical", name: "Harvard Medical School" },
  { code: "stanford-gsb", name: "Stanford Graduate School of Business" },
  { code: "booth", name: "University of Chicago Booth School of Business" },
  { code: "kellogg", name: "Northwestern Kellogg School of Management" },
  { code: "yale-law", name: "Yale Law School" },
  { code: "columbia-business", name: "Columbia Business School" },
  { code: "sloan", name: "MIT Sloan School of Management" },
  { code: "tuck", name: "Dartmouth Tuck School of Business" },
  { code: "haas", name: "Berkeley Haas School of Business" },
  { code: "stern", name: "NYU Stern School of Business" },
  { code: "ross", name: "Michigan Ross School of Business" },
  { code: "darden", name: "UVA Darden School of Business" },
  { code: "anderson", name: "UCLA Anderson School of Management" },
  
  // International Universities (for students who studied abroad)
  { code: "oxford", name: "University of Oxford" },
  { code: "cambridge", name: "University of Cambridge" },
  { code: "lse", name: "London School of Economics" },
  { code: "imperial", name: "Imperial College London" },
  { code: "ucl", name: "University College London" },
  { code: "edinburgh", name: "University of Edinburgh" },
  { code: "toronto", name: "University of Toronto" },
  { code: "mcgill", name: "McGill University" },
  { code: "ubc", name: "University of British Columbia" },
  { code: "anu", name: "Australian National University" },
  { code: "melbourne", name: "University of Melbourne" },
  { code: "sydney", name: "University of Sydney" },
  { code: "ntu", name: "Nanyang Technological University" },
  { code: "nus", name: "National University of Singapore" },
  { code: "hku", name: "University of Hong Kong" },
  { code: "eth", name: "ETH Zurich" },
  { code: "tsinghua", name: "Tsinghua University" },
  { code: "peking", name: "Peking University" },
  { code: "tokyo", name: "University of Tokyo" },
  
  // Special Option
  { code: "other", name: "Other (not listed)" }
];

// Update the fetchOrCreateProfile function with better error handling
const fetchOrCreateProfile = async (userId: number) => {
  try {
    console.log("Fetching profile for user:", userId);
    const response = await apiRequest("GET", `/api/profiles/${userId}`);

    if (!response.ok) {
      // If profile doesn't exist, return a default profile instead of throwing
      console.log("Profile not found, creating default");
      return {
        name: "",
        email: "",
        phone: "",
        title: "",
        bio: "",
        location: "",
        education: [],
        experience: [],
        skills: [],
        certifications: [],
        languages: [],
        publications: [],
        projects: [],
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        workAuthorization: "US Citizen",
        availability: "2 Weeks",
        citizenshipStatus: "",
        userId: userId,
        resumeUrl: "",
        transcriptUrl: ""
      };
    }

    const profile = await response.json();
    console.log("Fetched profile:", profile);
    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    // Return default profile instead of throwing
    return {
      name: "",
      email: "",
      phone: "",
      title: "",
      bio: "",
      location: "",
      education: [],
      experience: [],
      skills: [],
      certifications: [],
      languages: [],
      publications: [],
      projects: [],
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      workAuthorization: "US Citizen",
      availability: "2 Weeks",
      citizenshipStatus: "",
      userId: userId,
      resumeUrl: "",
      transcriptUrl: ""
    };
  }
};

// Add this function near the top of the file, before the ProfilePage component
const StatesSelect = React.forwardRef<
  HTMLSelectElement, 
  { 
    value: string, 
    onChange: (value: string) => void,
    placeholder?: string
  }
>(({ value, onChange, placeholder = "Select a state" }, ref) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // List of states with their codes
  const states = [
    { code: "none", name: "-- Select a state --" },
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "DC", name: "District of Columbia" }
  ];

  // Current selected state name
  const selectedState = states.find(state => state.code === value)?.name || placeholder;

  // Filter states based on search term (ignoring spaces)
  const filteredStates = states.filter(state => 
    state.name.toLowerCase().replace(/\s+/g, '').includes(searchTerm.toLowerCase().replace(/\s+/g, ''))
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isOpen && filteredStates.length > 0) {
        onChange(filteredStates[0].code);
        setIsOpen(false);
        setSearchTerm("");
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm("");
    } else if (isOpen && e.key === 'ArrowDown') {
      // Focus the first item in the dropdown
      const dropdownItem = containerRef.current?.querySelector('[role="option"]') as HTMLElement;
      if (dropdownItem) dropdownItem.focus();
    } else if (/^[a-zA-Z0-9\s]$/.test(e.key)) {
      if (!isOpen) {
        setIsOpen(true);
      }
      setSearchTerm(prev => prev + e.key);
    } else if (e.key === 'Backspace') {
      setSearchTerm(prev => prev.slice(0, -1));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearchTerm("");
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={`${value === "none" ? "text-muted-foreground" : ""}`}>
          {searchTerm ? searchTerm : selectedState}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-4 w-4 opacity-50"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            {filteredStates.length > 0 ? (
              filteredStates.map(state => (
                <div
                  key={state.code}
                  className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${state.code === value ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => {
                    onChange(state.code);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  role="option"
                  aria-selected={state.code === value}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onChange(state.code);
                      setIsOpen(false);
                      setSearchTerm("");
                    }
                  }}
                >
                  {state.code === value && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                  {state.name}
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

StatesSelect.displayName = 'StatesSelect';

// Add this CountriesSelect component after the StatesSelect component
const CountriesSelect = React.forwardRef<
  HTMLSelectElement, 
  { 
    value: string, 
    onChange: (value: string) => void,
    placeholder?: string
  }
>(({ value, onChange, placeholder = "Select a country" }, ref) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Comprehensive list of countries with their ISO codes
  const countries = [
    { code: "none", name: "-- Select a country --" },
    { code: "US", name: "United States" },
    { code: "AF", name: "Afghanistan" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AD", name: "Andorra" },
    { code: "AO", name: "Angola" },
    { code: "AG", name: "Antigua and Barbuda" },
    { code: "AR", name: "Argentina" },
    { code: "AM", name: "Armenia" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BS", name: "Bahamas" },
    { code: "BH", name: "Bahrain" },
    { code: "BD", name: "Bangladesh" },
    { code: "BB", name: "Barbados" },
    { code: "BY", name: "Belarus" },
    { code: "BE", name: "Belgium" },
    { code: "BZ", name: "Belize" },
    { code: "BJ", name: "Benin" },
    { code: "BT", name: "Bhutan" },
    { code: "BO", name: "Bolivia" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BW", name: "Botswana" },
    { code: "BR", name: "Brazil" },
    { code: "BN", name: "Brunei" },
    { code: "BG", name: "Bulgaria" },
    { code: "BF", name: "Burkina Faso" },
    { code: "BI", name: "Burundi" },
    { code: "CV", name: "Cabo Verde" },
    { code: "KH", name: "Cambodia" },
    { code: "CM", name: "Cameroon" },
    { code: "CA", name: "Canada" },
    { code: "CF", name: "Central African Republic" },
    { code: "TD", name: "Chad" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "KM", name: "Comoros" },
    { code: "CG", name: "Congo" },
    { code: "CD", name: "Congo, Democratic Republic of the" },
    { code: "CR", name: "Costa Rica" },
    { code: "CI", name: "Côte d'Ivoire" },
    { code: "HR", name: "Croatia" },
    { code: "CU", name: "Cuba" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "DJ", name: "Djibouti" },
    { code: "DM", name: "Dominica" },
    { code: "DO", name: "Dominican Republic" },
    { code: "EC", name: "Ecuador" },
    { code: "EG", name: "Egypt" },
    { code: "SV", name: "El Salvador" },
    { code: "GQ", name: "Equatorial Guinea" },
    { code: "ER", name: "Eritrea" },
    { code: "EE", name: "Estonia" },
    { code: "SZ", name: "Eswatini" },
    { code: "ET", name: "Ethiopia" },
    { code: "FJ", name: "Fiji" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" },
    { code: "GE", name: "Georgia" },
    { code: "DE", name: "Germany" },
    { code: "GH", name: "Ghana" },
    { code: "GR", name: "Greece" },
    { code: "GD", name: "Grenada" },
    { code: "GT", name: "Guatemala" },
    { code: "GN", name: "Guinea" },
    { code: "GW", name: "Guinea-Bissau" },
    { code: "GY", name: "Guyana" },
    { code: "HT", name: "Haiti" },
    { code: "HN", name: "Honduras" },
    { code: "HU", name: "Hungary" },
    { code: "IS", name: "Iceland" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IR", name: "Iran" },
    { code: "IQ", name: "Iraq" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IT", name: "Italy" },
    { code: "JM", name: "Jamaica" },
    { code: "JP", name: "Japan" },
    { code: "JO", name: "Jordan" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "KE", name: "Kenya" },
    { code: "KI", name: "Kiribati" },
    { code: "KP", name: "Korea, North" },
    { code: "KR", name: "Korea, South" },
    { code: "KW", name: "Kuwait" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "LA", name: "Laos" },
    { code: "LV", name: "Latvia" },
    { code: "LB", name: "Lebanon" },
    { code: "LS", name: "Lesotho" },
    { code: "LR", name: "Liberia" },
    { code: "LY", name: "Libya" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" },
    { code: "MY", name: "Malaysia" },
    { code: "MV", name: "Maldives" },
    { code: "ML", name: "Mali" },
    { code: "MT", name: "Malta" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" },
    { code: "MX", name: "Mexico" },
    { code: "FM", name: "Micronesia" },
    { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" },
    { code: "MN", name: "Mongolia" },
    { code: "ME", name: "Montenegro" },
    { code: "MA", name: "Morocco" },
    { code: "MZ", name: "Mozambique" },
    { code: "MM", name: "Myanmar" },
    { code: "NA", name: "Namibia" },
    { code: "NR", name: "Nauru" },
    { code: "NP", name: "Nepal" },
    { code: "NL", name: "Netherlands" },
    { code: "NZ", name: "New Zealand" },
    { code: "NI", name: "Nicaragua" },
    { code: "NE", name: "Niger" },
    { code: "NG", name: "Nigeria" },
    { code: "MK", name: "North Macedonia" },
    { code: "NO", name: "Norway" },
    { code: "OM", name: "Oman" },
    { code: "PK", name: "Pakistan" },
    { code: "PW", name: "Palau" },
    { code: "PA", name: "Panama" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PY", name: "Paraguay" },
    { code: "PE", name: "Peru" },
    { code: "PH", name: "Philippines" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "QA", name: "Qatar" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russia" },
    { code: "RW", name: "Rwanda" },
    { code: "KN", name: "Saint Kitts and Nevis" },
    { code: "LC", name: "Saint Lucia" },
    { code: "VC", name: "Saint Vincent and the Grenadines" },
    { code: "WS", name: "Samoa" },
    { code: "SM", name: "San Marino" },
    { code: "ST", name: "Sao Tome and Principe" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SN", name: "Senegal" },
    { code: "RS", name: "Serbia" },
    { code: "SC", name: "Seychelles" },
    { code: "SL", name: "Sierra Leone" },
    { code: "SG", name: "Singapore" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "SB", name: "Solomon Islands" },
    { code: "SO", name: "Somalia" },
    { code: "ZA", name: "South Africa" },
    { code: "SS", name: "South Sudan" },
    { code: "ES", name: "Spain" },
    { code: "LK", name: "Sri Lanka" },
    { code: "SD", name: "Sudan" },
    { code: "SR", name: "Suriname" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "SY", name: "Syria" },
    { code: "TW", name: "Taiwan" },
    { code: "TJ", name: "Tajikistan" },
    { code: "TZ", name: "Tanzania" },
    { code: "TH", name: "Thailand" },
    { code: "TL", name: "Timor-Leste" },
    { code: "TG", name: "Togo" },
    { code: "TO", name: "Tonga" },
    { code: "TT", name: "Trinidad and Tobago" },
    { code: "TN", name: "Tunisia" },
    { code: "TR", name: "Turkey" },
    { code: "TM", name: "Turkmenistan" },
    { code: "TV", name: "Tuvalu" },
    { code: "UG", name: "Uganda" },
    { code: "UA", name: "Ukraine" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "GB", name: "United Kingdom" },
    { code: "UY", name: "Uruguay" },
    { code: "UZ", name: "Uzbekistan" },
    { code: "VU", name: "Vanuatu" },
    { code: "VA", name: "Vatican City" },
    { code: "VE", name: "Venezuela" },
    { code: "VN", name: "Vietnam" },
    { code: "YE", name: "Yemen" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" }
  ];

  // Current selected country name
  const selectedCountry = countries.find(country => country.code === value)?.name || placeholder;

  // Filter countries based on search term (ignoring spaces)
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().replace(/\s+/g, '').includes(searchTerm.toLowerCase().replace(/\s+/g, ''))
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isOpen && filteredCountries.length > 0) {
        onChange(filteredCountries[0].code);
        setIsOpen(false);
        setSearchTerm("");
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm("");
    } else if (isOpen && e.key === 'ArrowDown') {
      // Focus the first item in the dropdown
      const dropdownItem = containerRef.current?.querySelector('[role="option"]') as HTMLElement;
      if (dropdownItem) dropdownItem.focus();
    } else if (/^[a-zA-Z0-9\s]$/.test(e.key)) {
      if (!isOpen) {
        setIsOpen(true);
      }
      setSearchTerm(prev => prev + e.key);
    } else if (e.key === 'Backspace') {
      setSearchTerm(prev => prev.slice(0, -1));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearchTerm("");
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={`${value === "none" ? "text-muted-foreground" : ""}`}>
          {searchTerm ? searchTerm : selectedCountry}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-4 w-4 opacity-50"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map(country => (
                <div
                  key={country.code}
                  className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${country.code === value ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => {
                    onChange(country.code);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  role="option"
                  aria-selected={country.code === value}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onChange(country.code);
                      setIsOpen(false);
                      setSearchTerm("");
                    }
                  }}
                >
                  {country.code === value && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                  {country.name}
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

CountriesSelect.displayName = 'CountriesSelect';

// Add this WorkLocationSelect component after the CountriesSelect component
const WorkLocationSelect = React.forwardRef<
  HTMLSelectElement, 
  { 
    value: string, 
    onChange: (value: string) => void,
    placeholder?: string
  }
>(({ value, onChange, placeholder = "Select preferred work location" }, ref) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Work location options
  const locations = [
    { code: "none", name: "-- Select work location --" },
    { code: "office", name: "Office" },
    { code: "hybrid", name: "Hybrid" },
    { code: "remote", name: "Remote" }
  ];

  // Current selected location
  const selectedLocation = locations.find(location => location.code === value)?.name || placeholder;

  // Filter locations based on search term (ignoring spaces)
  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().replace(/\s+/g, '').includes(searchTerm.toLowerCase().replace(/\s+/g, ''))
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isOpen && filteredLocations.length > 0) {
        onChange(filteredLocations[0].code);
        setIsOpen(false);
        setSearchTerm("");
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm("");
    } else if (isOpen && e.key === 'ArrowDown') {
      // Focus the first item in the dropdown
      const dropdownItem = containerRef.current?.querySelector('[role="option"]') as HTMLElement;
      if (dropdownItem) dropdownItem.focus();
    } else if (/^[a-zA-Z0-9\s]$/.test(e.key)) {
      if (!isOpen) {
        setIsOpen(true);
      }
      setSearchTerm(prev => prev + e.key);
    } else if (e.key === 'Backspace') {
      setSearchTerm(prev => prev.slice(0, -1));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearchTerm("");
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={`${value === "none" ? "text-muted-foreground" : ""}`}>
          {searchTerm ? searchTerm : selectedLocation}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-4 w-4 opacity-50"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            {filteredLocations.length > 0 ? (
              filteredLocations.map(location => (
                <div
                  key={location.code}
                  className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${location.code === value ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => {
                    onChange(location.code);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  role="option"
                  aria-selected={location.code === value}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onChange(location.code);
                      setIsOpen(false);
                      setSearchTerm("");
                    }
                  }}
                >
                  {location.code === value && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                  {location.name}
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

WorkLocationSelect.displayName = 'WorkLocationSelect';

// Add this UniversitiesSelect component after the WorkLocationSelect component
const UniversitiesSelect = React.forwardRef<
  HTMLSelectElement, 
  { 
    value: string, 
    onChange: (value: string) => void,
    placeholder?: string
  }
>(({ value, onChange, placeholder = "Select university/college" }, ref) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current selected university name
  const selectedUniversity = UNIVERSITIES.find(university => university.code === value)?.name || placeholder;

  // Filter universities based on search term (ignoring spaces)
  const filteredUniversities = UNIVERSITIES.filter(university => 
    university.name.toLowerCase().replace(/\s+/g, '').includes(searchTerm.toLowerCase().replace(/\s+/g, ''))
  );

  // Always ensure "Other" and "None" options are available
  const otherOption = UNIVERSITIES.find(university => university.code === "other");
  const noneOption = UNIVERSITIES.find(university => university.code === "none");
  
  // Add "Other" to filtered results if it's not already there
  if (otherOption && !filteredUniversities.some(uni => uni.code === "other")) {
    filteredUniversities.push(otherOption);
  }
  
  // Make sure "None" is at the beginning if we're showing all options
  if (noneOption && !searchTerm && !filteredUniversities.some(uni => uni.code === "none")) {
    filteredUniversities.unshift(noneOption);
  }

  // Handle selection of an item
  const handleItemSelect = (itemValue: string) => {
    onChange(itemValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isOpen && filteredUniversities.length > 0) {
        onChange(filteredUniversities[0].code);
        setIsOpen(false);
        setSearchTerm("");
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm("");
    } else if (isOpen && e.key === 'ArrowDown') {
      // Focus the first item in the dropdown
      const dropdownItem = containerRef.current?.querySelector('[role="option"]') as HTMLElement;
      if (dropdownItem) dropdownItem.focus();
    } else if (/^[a-zA-Z0-9\s]$/.test(e.key)) {
      if (!isOpen) {
        setIsOpen(true);
      }
      setSearchTerm(prev => prev + e.key);
    } else if (e.key === 'Backspace') {
      setSearchTerm(prev => prev.slice(0, -1));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearchTerm("");
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={`${value === "none" ? "text-muted-foreground" : ""}`}>
          {searchTerm ? searchTerm : selectedUniversity}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-4 w-4 opacity-50"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            {filteredUniversities.length > 0 ? (
              <>
                {/* Render the main list of universities */}
                {filteredUniversities
                  // Put "Other" option at the end of the list, and "None" at the beginning
                  .sort((a, b) => {
                    if (a.code === "none") return -1;
                    if (b.code === "none") return 1;
                    if (a.code === "other") return 1;
                    if (b.code === "other") return -1;
                    return a.name.localeCompare(b.name);
                  })
                  .filter(university => university.code !== "other") // Remove "other" from the main list
                  .map(university => {
                    return (
                      <div
                        key={university.code}
                        className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                          university.code === value ? 'bg-accent text-accent-foreground' : ''
                        }`}
                        onClick={() => handleItemSelect(university.code)}
                        role="option"
                        aria-selected={university.code === value}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleItemSelect(university.code);
                          }
                        }}
                      >
                        {university.code === value && (
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </span>
                        )}
                        {university.name}
                      </div>
                    );
                  })}
                
                {/* Add a separate "Other" button at the bottom */}
                <button
                  className="w-full mt-2 p-2 border-t pt-2 text-primary font-medium flex items-center justify-center hover:bg-primary hover:text-primary-foreground rounded-sm"
                  onClick={() => {
                    handleItemSelect("other");
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Other Institution
                </button>
              </>
            ) : (
              <>
                <div className="text-center py-2 text-sm text-muted-foreground">No results found</div>
                {/* Add option to add custom institution when no results found */}
                <button
                  className="w-full mt-2 p-2 border-t pt-2 text-primary font-medium flex items-center justify-center hover:bg-primary hover:text-primary-foreground rounded-sm"
                  onClick={() => {
                    // Set the search term as the custom value
                    if (searchTerm) {
                      onChange(searchTerm);
                    } else {
                      onChange("other");
                    }
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  {searchTerm ? `Add "${searchTerm}"` : "Add Other Institution"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

UniversitiesSelect.displayName = 'UniversitiesSelect';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [debugMsg, setDebugMsg] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [fileState, setFileState] = useState<FileState>({});
  const form = useForm<InsertProfile>({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      title: "",
      bio: "",
      location: "",
      education: [],
      experience: [],
      skills: [],
      certifications: [],
      languages: [],
      publications: [],
      projects: [],
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      workAuthorization: "US Citizen",
      availability: "2 Weeks",
      citizenshipStatus: "",
      userId: user?.id,
      resumeUrl: "",
      transcriptUrl: ""
    }
  });

  // Update the useQuery implementation for profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("No user ID");
      return fetchOrCreateProfile(user.id);
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Keep the data forever until explicitly invalidated
    gcTime: Infinity, // Never remove this data from the cache (replaces cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    refetchOnMount: false, // Don't refetch when component mounts
  });

  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      console.log("Setting form values from profile:", profile);
      
      // We need to safely handle each field type to prevent errors
      form.setValue("name", profile.name || "", { shouldDirty: false });
      form.setValue("email", profile.email || "", { shouldDirty: false });
      form.setValue("phone", profile.phone || "", { shouldDirty: false });
      form.setValue("title", profile.title || "", { shouldDirty: false });
      form.setValue("bio", profile.bio || "", { shouldDirty: false });
      form.setValue("location", profile.location || "", { shouldDirty: false });
      
      // Address fields
      form.setValue("address", profile.address || "", { shouldDirty: false });
      form.setValue("city", profile.city || "", { shouldDirty: false });
      form.setValue("state", profile.state || "", { shouldDirty: false });
      form.setValue("zipCode", profile.zipCode || "", { shouldDirty: false });
      form.setValue("country", profile.country || "", { shouldDirty: false });
      
      // Work fields
      form.setValue("workAuthorization", profile.workAuthorization || "", { shouldDirty: false });
      form.setValue("availability", profile.availability || "", { shouldDirty: false });
      form.setValue("citizenshipStatus", profile.citizenshipStatus || "", { shouldDirty: false });
      form.setValue("visaSponsorship", profile.visaSponsorship || false, { shouldDirty: false });
      form.setValue("willingToRelocate", profile.willingToRelocate || false, { shouldDirty: false });
      form.setValue("salaryExpectation", profile.salaryExpectation || "", { shouldDirty: false });
      
      // Array fields
      if (Array.isArray(profile.education)) form.setValue("education", profile.education, { shouldDirty: false });
      if (Array.isArray(profile.experience)) form.setValue("experience", profile.experience, { shouldDirty: false });
      if (Array.isArray(profile.skills)) form.setValue("skills", profile.skills, { shouldDirty: false });
      if (Array.isArray(profile.certifications)) form.setValue("certifications", profile.certifications, { shouldDirty: false });
      if (Array.isArray(profile.languages)) form.setValue("languages", profile.languages, { shouldDirty: false });
      if (Array.isArray(profile.publications)) form.setValue("publications", profile.publications, { shouldDirty: false });
      if (Array.isArray(profile.projects)) form.setValue("projects", profile.projects, { shouldDirty: false });
      if (Array.isArray(profile.preferredLocations)) form.setValue("preferredLocations", profile.preferredLocations, { shouldDirty: false });
      
      // URL fields
      form.setValue("resumeUrl", profile.resumeUrl || "", { shouldDirty: false });
      form.setValue("transcriptUrl", profile.transcriptUrl || "", { shouldDirty: false });
      form.setValue("linkedinUrl", profile.linkedinUrl || "", { shouldDirty: false });
      form.setValue("portfolioUrl", profile.portfolioUrl || "", { shouldDirty: false });
      form.setValue("githubUrl", profile.githubUrl || "", { shouldDirty: false });
      
      // Reset form's dirty state
      if (formRef.current) {
        formRef.current.dataset.isDirty = 'false';
      }
    }
  }, [profile]);

  const { fields: educationFields, append: appendEducation, remove: removeEducation } =
    useFieldArray({
      control: form.control,
      name: "education"
    });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } =
    useFieldArray({
      control: form.control,
      name: "experience"
    });

  // Add field arrays for new sections
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } =
    useFieldArray({
      control: form.control,
      name: "certifications"
    });

  const { fields: projectFields, append: appendProject, remove: removeProject } =
    useFieldArray({
      control: form.control,
      name: "projects"
    });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } =
    useFieldArray({
      control: form.control,
      name: "languages"
    });

  // Handle adding skills
  const handleAddSkill = useCallback(() => {
    if (skillInput.trim()) {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(skillInput.trim())) {
        form.setValue("skills", [...currentSkills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  }, [skillInput, form]);

  // Handle removing skills
  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(s => typeof s === 'string' && s !== skillToRemove));
  }, [form]);

  // Handle adding language
  const handleAddLanguage = useCallback(() => {
    if (languageInput.trim()) {
      appendLanguage({
        name: languageInput.trim(),
        proficiency: "Intermediate"
      });
      setLanguageInput("");
    }
  }, [languageInput, appendLanguage]);

  // Add this effect to track form dirty state
  useEffect(() => {
    // Update form dirty state for navigation warning
    if (formRef.current) {
      formRef.current.dataset.isDirty = form.formState.isDirty ? 'true' : 'false';
    }
  }, [form.formState.isDirty]);

  // Completely rewrite the onSubmit function to properly persist form data
  const onSubmit = async (data: InsertProfile) => {
    try {
      // Store the current form values
      const currentValues = form.getValues();
      console.log("Submitting form values:", currentValues);
      
      // Ensure we're adding user ID to the profile data
      const profileData = {
        ...currentValues,
        userId: user?.id
      };
      
      console.log("Sending profile data to server", profileData);
      
      // Submit to server 
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || 'Failed to save profile');
      }
      
      // Process the response
      const savedProfile = await response.json();
      console.log("Server returned saved profile:", savedProfile);
      
      // Update the React Query cache with the saved data
      queryClient.setQueryData(["profile", user?.id], savedProfile);
      
      // Reset form state to mark as pristine
      form.reset(savedProfile);
      
      // Mark form as pristine
      if (formRef.current) {
        formRef.current.dataset.isDirty = 'false';
      }
      
      toast({
        title: "Success",
        description: "Your profile has been saved successfully.",
      });
      
      return savedProfile;
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDirectSave = () => {
    console.log("Direct save button clicked");

    // Get current form values
    const formData = form.getValues();

    // Log validation errors but proceed anyway
    if (Object.keys(form.formState.errors).length > 0) {
      console.warn("Form has validation errors:", form.formState.errors);
    }

    // Bypass the form validation and submit directly
    onSubmit(formData).then(() => {
      // Fix the null check on user
      if (user?.id) {
        // Force a refetch of the profile data to ensure UI is in sync
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      }
    });
  };


  const cleanObject = (obj: any) => {
    const cleaned: any = {};

    // Copy all defined properties
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        // Handle specific field types
        if (typeof obj[key] === 'string') {
          cleaned[key] = obj[key] || "";
        } else if (Array.isArray(obj[key])) {
          cleaned[key] = obj[key].map(cleanObject);
        } else {
          cleaned[key] = obj[key];
        }
      } else {
        // For undefined values, set defaults based on field type
        if (key === 'name' || key === 'title' || key === 'description' || key === 'institution' ||
            key === 'company' || key === 'location' || key === 'url' || key === 'issuer') {
          cleaned[key] = "";
        }
      }
    });

    return cleaned;
  };

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  // Update getUniversityName to use the UNIVERSITIES constant
  const getUniversityName = (code: string) => {
    // If the code is empty, return empty string
    if (!code) return "";
    
    // Find university by code
    const university = UNIVERSITIES.find(uni => uni.code === code);
    
    // Return the name if found, otherwise the code itself is the custom institution name
    return university ? university.name : code;
  };

  // Modify the education card to use getUniversityName for displaying institution
  const getEducationCard = useCallback((edu: any, index: number) => {
    // Only render if we have a degree and institution
    if (!edu.degree && !edu.institution) return null;
    
    return (
      <div key={index} className="border rounded-lg p-4 mb-2 relative">
        <div className="flex flex-col">
          <span className="font-medium">{edu.degree || "Degree not specified"}</span>
          <span>{getUniversityName(edu.institution) || "Institution not specified"}</span>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {edu.startDate || "Start date not specified"} - {edu.endDate || "End date not specified"}
            </span>
          </div>
        </div>
      </div>
    );
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-2 max-w-7xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Form {...form}>
        <form
          ref={formRef}
          data-is-dirty="false"
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submit triggered");
            const formData = form.getValues();
            console.log("Form data:", formData);
            onSubmit(formData).catch(error => {
              console.error("Error submitting form:", error);
              toast({
                title: "Error",
                description: error.message || "Failed to save profile",
                variant: "destructive"
              });
            });
          }}
          className="space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.2
            }}
          >
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4 flex flex-wrap justify-start gap-2 border-b pb-2 w-full">
                <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Personal Info</TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Education</TabsTrigger>
                <TabsTrigger value="experience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Experience</TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Skills & Languages</TabsTrigger>
                <TabsTrigger value="certifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Certifications</TabsTrigger>
                <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Projects</TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Documents</TabsTrigger>
                <TabsTrigger value="additional" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Additional</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Personal Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} placeholder="https://linkedin.com/in/username" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="portfolioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio URL</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} placeholder="https://yourportfolio.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Summary</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="min-h-[120px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <StatesSelect
                                  value={field.value || "none"}
                                  onChange={(value) => {
                                    field.onChange(value === "none" ? "" : value);
                                  }}
                                  placeholder="Select a state"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <CountriesSelect
                                  value={field.value || "none"}
                                  onChange={(value) => {
                                    field.onChange(value === "none" ? "" : value);
                                  }}
                                  placeholder="Select a country"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Location</FormLabel>
                              <FormControl>
                                <WorkLocationSelect
                                  value={field.value || "none"}
                                  onChange={(value) => {
                                    field.onChange(value === "none" ? "" : value);
                                  }}
                                  placeholder="Select preferred work location"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="education" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Education</CardTitle>
                      <CardDescription>Add your educational background</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {educationFields.map((field, index) => (
                        <div key={field.id} className="mb-8 p-4 border rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeEducation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.institution`}
                              render={({ field }) => {
                                // Track whether to show the custom input field
                                const [showCustomInput, setShowCustomInput] = useState(false);
                                
                                // Initialize and update showCustomInput based on field value
                                useEffect(() => {
                                  const isCustomValue = !!field.value && !UNIVERSITIES.some(uni => uni.code === field.value);
                                  console.log('Field value changed:', field.value, 'isCustomValue:', isCustomValue);
                                  setShowCustomInput(isCustomValue);
                                }, [field.value]);
                                
                                // Handle selection from dropdown
                                const handleSelectChange = (value: string) => {
                                  console.log("Selected university:", value);
                                  
                                  if (value === "other") {
                                    // Show custom input when "Other" is selected
                                    console.log("Other selected, showing custom input");
                                    setShowCustomInput(true);
                                    
                                    // If coming from a predefined value, clear it
                                    if (UNIVERSITIES.some(uni => uni.code === field.value)) {
                                      field.onChange("");
                                    }
                                  } else {
                                    // Hide custom input for predefined values
                                    console.log("University selected, hiding custom input");
                                    setShowCustomInput(false);
                                    field.onChange(value === "none" ? "" : value);
                                  }
                                };
                                
                                // Handle change in custom input
                                const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                  console.log("Custom input changed:", e.target.value);
                                  field.onChange(e.target.value);
                                };
                                
                                // Determine dropdown display value
                                const selectValue = field.value && UNIVERSITIES.some(uni => uni.code === field.value)
                                  ? field.value
                                  : showCustomInput ? "other" : field.value ? "other" : "none";
                                
                                console.log('Rendering institution field:', { 
                                  fieldValue: field.value, 
                                  selectValue, 
                                  showCustomInput
                                });
                                
                                return (
                                  <FormItem className="space-y-4">
                                    <FormLabel>Institution</FormLabel>
                                    <FormControl>
                                      <div className="space-y-3">
                                        <UniversitiesSelect 
                                          value={selectValue}
                                          onChange={handleSelectChange}
                                          placeholder="Select university/college"
                                        />
                                        
                                        {showCustomInput && (
                                          <div className="mt-3 p-3 border border-primary rounded-md space-y-2">
                                            <div className="text-sm text-muted-foreground">
                                              Please enter the name of your institution below. This helps us improve our database.
                                            </div>
                                            <Input 
                                              placeholder="Enter institution name" 
                                              value={field.value || ""}
                                              onChange={handleCustomInputChange}
                                              className="border-primary focus-visible:ring-primary"
                                              autoFocus
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />

                            <FormField
                              control={form.control}
                              name={`education.${index}.degree`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Degree</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Bachelor of Science" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.field`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field of Study</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Computer Science" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`education.${index}.gpa`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GPA</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., 3.8" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="month" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div>
                              <FormField
                                control={form.control}
                                name={`education.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="month" disabled={form.watch(`education.${index}.isPresent`)} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`education.${index}.isPresent`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                          field.onChange(checked);
                                          if (checked) {
                                            form.setValue(`education.${index}.endDate`, "");
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Currently studying here</FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendEducation({
                          institution: "",
                          degree: "",
                          field: "",
                          startDate: "",
                          endDate: "",
                          isPresent: false,
                          gpa: ""
                        })}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Education
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="experience" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Experience</CardTitle>
                      <CardDescription>Add your work experience</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {experienceFields.map((field, index) => (
                        <div key={field.id} className="mb-8 p-4 border rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeExperience(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.company`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Company name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`experience.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Job title" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.location`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="City, State or Remote" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`experience.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="month" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div>
                                <FormField
                                  control={form.control}
                                  name={`experience.${index}.endDate`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>End Date</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="month" disabled={form.watch(`experience.${index}.isPresent`)} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`experience.${index}.isPresent`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (checked) {
                                              form.setValue(`experience.${index}.endDate`, "");
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Currently working here</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name={`experience.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Describe your responsibilities and achievements" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendExperience({
                          company: "",
                          title: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          isPresent: false,
                          description: ""
                        })}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Experience
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="skills" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Skills & Languages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <FormLabel>Skills</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {form.watch("skills")?.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                              {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-2"
                                onClick={() => typeof skill === 'string' && handleRemoveSkill(skill)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            placeholder="Add a skill (e.g., JavaScript, Project Management)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddSkill}>Add</Button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <FormLabel className="text-base">Languages</FormLabel>
                          <div className="flex gap-2">
                            <Input
                              value={languageInput}
                              onChange={(e) => setLanguageInput(e.target.value)}
                              placeholder="Language name"
                              className="w-48"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddLanguage();
                                }
                              }}
                            />
                            <Button type="button" onClick={handleAddLanguage}>Add</Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {languageFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                              <div className="flex-1">
                                <FormField
                                  control={form.control}
                                  name={`languages.${index}.name`}
                                  render={({ field }) => (
                                    <div className="font-medium">{field.value}</div>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name={`languages.${index}.proficiency`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select proficiency" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Basic">Basic</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                        <SelectItem value="Native">Native</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLanguage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="certifications" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Certifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Professional Certifications</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendCertification({
                            name: "",
                            issuer: "",
                            issueDate: "",
                            expiryDate: "",
                            credentialId: "",
                            credentialUrl: ""
                          })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <Award className="h-4 w-4 mr-2" />
                          Add Certification
                        </Button>
                      </CardHeader>

                      {certificationFields.map((field, index) => (
                        <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => removeCertification(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`certifications.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Certification Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.issuer`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Issuing Organization</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.credentialId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credential ID</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.credentialUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credential URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="url" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.issueDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Issue Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.expiryDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expiry Date (if applicable)</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="projects" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Projects</CardTitle>
                      <CardDescription>
                        Add details about your projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {projectFields.map((field, index) => (
                        <div key={field.id} className="border p-4 rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeProject(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`projects.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Project name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`projects.${index}.url`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="https://" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`projects.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Describe your project" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          appendProject({
                            title: "",
                            url: "",
                            description: ""
                          });
                          // Mark form as dirty when adding a new project
                          if (formRef.current) {
                            formRef.current.dataset.isDirty = 'true';
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Project
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="documents" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Documents & Links</CardTitle>
                      <CardDescription>
                        Upload your documents and add your professional links
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Documents</h3>
                          <FormItem>
                            <FormLabel>Resume (PDF only)</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setFileState(prev => ({ ...prev, resume: file }));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload your current resume (max 5MB)
                            </FormDescription>
                            {profile?.resumeUrl && !profile.resumeUrl.startsWith('blob:') && (
                              <div className="mt-2">
                                <a
                                  href={profile.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                >
                                  View Current Resume
                                </a>
                              </div>
                            )}
                          </FormItem>

                          <FormItem>
                            <FormLabel>Transcript (PDF only)</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setFileState(prev => ({ ...prev, transcript: file }));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload your academic transcript (max 5MB)
                            </FormDescription>
                            {profile?.transcriptUrl && !profile.transcriptUrl.startsWith('blob:') && (
                              <div className="mt-2">
                                <a
                                  href={profile.transcriptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                >
                                  View Current Transcript
                                </a>
                              </div>
                            )}
                          </FormItem>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Professional Links</h3>
                          <FormField
                            control={form.control}
                            name="linkedinUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LinkedIn URL</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} placeholder="https://linkedin.com/in/username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="githubUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GitHub URL</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} placeholder="https://github.com/username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="portfolioUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Portfolio URL</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} placeholder="https://yourportfolio.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="additional" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                      <CardDescription>
                        Provide additional details about your work preferences and availability
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="workAuthorization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Authorization</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select work authorization" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="US Citizen">US Citizen</SelectItem>
                                  <SelectItem value="Green Card">Green Card</SelectItem>
                                  <SelectItem value="H1B">H1B</SelectItem>
                                  <SelectItem value="F1 OPT">F1 OPT</SelectItem>
                                  <SelectItem value="TN Visa">TN Visa</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="availability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Availability</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select availability" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Immediate">Immediate</SelectItem>
                                  <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                                  <SelectItem value="1 Month">1 Month</SelectItem>
                                  <SelectItem value="3 Months">3 Months</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="citizenshipStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Citizenship Status</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select citizenship status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="US Citizen">US Citizen</SelectItem>
                                    <SelectItem value="Permanent Resident">Permanent Resident</SelectItem>
                                    <SelectItem value="Non-Resident">Non-Resident</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="visaSponsorship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Need Visa Sponsorship</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value === "true")}
                                value={field.value ? "true" : "false"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="willingToRelocate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Willing to Relocate</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value === "true")}
                                value={field.value ? "true" : "false"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="salaryExpectation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salary Expectation</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  value={field.value || ''} 
                                  placeholder="e.g., $80,000 - $100,000" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Single submit button for the entire form */}
          <motion.div 
            className="flex justify-end mt-6 pb-8"
            variants={itemVariants}
          >
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="min-w-[120px]"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
}