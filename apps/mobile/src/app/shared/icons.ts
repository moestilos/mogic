import {
  // UI core
  Crown, Sparkles, Settings, X, Plus, Minus, Undo2, RotateCw,
  Search, ChevronLeft, LogIn, LogOut, Mail, Lock, Trash2, Check,
  // People
  User, UserPlus, Users,
  // Counters / game
  Dice5, Dices, Zap, Star, Skull, CloudLightning, Radiation, PlusCircle,
  Swords, Sword, Shield, Axe, Hammer, Flag, Target, Crosshair,
  Trophy, Award, Medal, Ribbon, BadgeCheck,
  // Mystical / fantasy
  Sparkle, Stars, Gem, Diamond, KeyRound, Key,
  Castle, Scroll, ScrollText, Book, BookOpen, NotebookPen,
  Feather, Wand2, Ghost, Eye, Bone, Brain,
  Heart, HeartPulse, Hand,
  Lightbulb, Lamp, LampDesk, FlameKindling, Flame,
  // Nature / weather
  Moon, Sun, CloudMoon, CloudSun, CloudRain, CloudSnow, CloudFog,
  Snowflake, Tornado, Wind, Waves, Droplets,
  Mountain, Anchor, Leaf, TreePine, TreeDeciduous, Sprout, Flower, Flower2,
  // Animals
  Bird, Fish, Cat, Dog, Rabbit, Squirrel, Turtle, Worm, Rat, Bug, Snail, PawPrint,
  // Food / drinks
  Cherry, Apple, Cookie, Pizza, Carrot, Egg, Drumstick, Wheat, Grape,
  IceCream, Coffee, Wine, Martini, Beer, GlassWater, Cake,
  // Games / play
  Gamepad2, Joystick, Puzzle, Spade, Club,
  Music, Music2, Disc, Disc3, Headphones,
  // Sci / tech
  Atom, FlaskConical, TestTube, Microscope, Cog, Wrench, Construction,
  Camera, Film, Video, Glasses,
  // Shapes / abstract
  Hexagon, Octagon, Triangle, Pyramid, Box, Boxes, Package,
  CircleDot, Asterisk,
  // Money
  Coins, Banknote, Wallet,
  // Travel / nav
  Sailboat, Ship, Plane, Train, Car, Truck, Bike, Footprints,
  Telescope, Compass, Map, Globe, Earth, Tent, Rocket,
  // Festive
  PartyPopper, Gift,
  // Arrows
  ArrowUp, ArrowDown,
} from 'lucide-angular';

export const Icons = {
  Crown, Sparkles, Settings, X, Plus, Minus, Undo2, RotateCw,
  Search, ChevronLeft, LogIn, LogOut, Mail, Lock, Trash2, Check,
  User, UserPlus, Users,
  Dice5, Dices, Zap, Star, Skull, CloudLightning, Radiation, PlusCircle,
  Swords, Sword, Shield, Axe, Hammer, Flag, Target, Crosshair,
  Trophy, Award, Medal, Ribbon, BadgeCheck,
  Sparkle, Stars, Gem, Diamond, KeyRound, Key,
  Castle, Scroll, ScrollText, Book, BookOpen, NotebookPen,
  Feather, Wand: Wand2, Ghost, Eye, Bone, Brain,
  Heart, HeartPulse, Hand,
  Lightbulb, Lamp, LampDesk, FlameKindling, Flame,
  Moon, Sun, CloudMoon, CloudSun, CloudRain, CloudSnow, CloudFog,
  Snowflake, Tornado, Wind, Waves, Droplets,
  Mountain, Anchor, Leaf, TreePine, TreeDeciduous, Sprout, Flower, Flower2,
  Bird, Fish, Cat, Dog, Rabbit, Squirrel, Turtle, Worm, Rat, Bug, Snail, PawPrint,
  Cherry, Apple, Cookie, Pizza, Carrot, Egg, Drumstick, Wheat, Grape,
  IceCream, Coffee, Wine, Martini, Beer, GlassWater, Cake,
  Gamepad2, Joystick, Puzzle, Spade, Club,
  Music, Music2, Disc, Disc3, Headphones,
  Atom, FlaskConical, TestTube, Microscope, Cog, Wrench, Construction,
  Camera, Film, Video, Glasses,
  Hexagon, Octagon, Triangle, Pyramid, Box, Boxes, Package,
  CircleDot, Asterisk,
  Coins, Banknote, Wallet,
  Sailboat, Ship, Plane, Train, Car, Truck, Bike, Footprints,
  Telescope, Compass, Map, Globe, Earth, Tent, Rocket,
  PartyPopper, Gift,
  ArrowUp, ArrowDown,
};

export type IconKey = keyof typeof Icons;

/** 60 avatars curated by category with visual variety. */
export const AVATAR_ICONS: IconKey[] = [
  // Mystical (12)
  'Crown', 'Wand', 'Skull', 'Ghost', 'Gem', 'Eye',
  'Castle', 'Scroll', 'Sparkles', 'Stars', 'Diamond', 'KeyRound',
  // Combat (8)
  'Sword', 'Axe', 'Hammer', 'Shield', 'Swords', 'Crosshair', 'Target', 'Flag',
  // Elements / nature (12)
  'Flame', 'Snowflake', 'Tornado', 'Wind', 'Waves', 'Droplets',
  'Mountain', 'TreePine', 'Sprout', 'Leaf', 'Flower2', 'Anchor',
  // Animals (12)
  'Bird', 'Fish', 'Cat', 'Dog', 'Rabbit', 'Squirrel',
  'Turtle', 'Bug', 'Snail', 'Worm', 'PawPrint', 'Rat',
  // Celestial / wisdom (6)
  'Moon', 'Sun', 'CloudMoon', 'Telescope', 'Compass', 'Globe',
  // Mind / sci (5)
  'Brain', 'Heart', 'Atom', 'FlaskConical', 'Lightbulb',
  // Gaming / play (5)
  'Gamepad2', 'Dices', 'Joystick', 'Puzzle', 'Music',
];

/** 24 group icons. */
export const GROUP_ICONS: IconKey[] = [
  'Crown', 'Sword', 'Swords', 'Shield', 'Skull', 'Wand',
  'Castle', 'Flame', 'Moon', 'Sun', 'Star', 'Sparkles',
  'Dices', 'Gamepad2', 'Trophy', 'Award', 'Medal', 'Flag',
  'Beer', 'Wine', 'Pizza', 'Cake', 'Coffee', 'PartyPopper',
];
