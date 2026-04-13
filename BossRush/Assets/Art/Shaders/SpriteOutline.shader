Shader "Sprites/Outline"
{
    Properties
    {
        [PerRendererData] _MainTex ("Sprite Texture", 2D) = "white" {}
        _Color ("Tint", Color) = (1,1,1,1)
        _OutlineColor ("Outline Color", Color) = (0.1, 0.05, 0.02, 1)
        _OutlineThickness ("Outline Thickness (UV)", Range(0, 0.05)) = 0.008
    }

    SubShader
    {
        Tags
        {
            "Queue"="Transparent"
            "IgnoreProjector"="True"
            "RenderType"="Transparent"
            "PreviewType"="Plane"
            "CanUseSpriteAtlas"="True"
        }

        Cull Off
        Lighting Off
        ZWrite Off
        Blend SrcAlpha OneMinusSrcAlpha

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata_t
            {
                float4 vertex   : POSITION;
                float4 color    : COLOR;
                float2 texcoord : TEXCOORD0;
            };

            struct v2f
            {
                float4 vertex   : SV_POSITION;
                fixed4 color    : COLOR;
                float2 texcoord : TEXCOORD0;
            };

            sampler2D _MainTex;
            fixed4 _Color;
            fixed4 _OutlineColor;
            float _OutlineThickness;

            v2f vert(appdata_t IN)
            {
                v2f OUT;
                OUT.vertex = UnityObjectToClipPos(IN.vertex);
                OUT.texcoord = IN.texcoord;
                OUT.color = IN.color * _Color;
                return OUT;
            }

            fixed4 frag(v2f IN) : SV_Target
            {
                float2 uv = IN.texcoord;
                fixed4 col = tex2D(_MainTex, uv) * IN.color;
                float d = _OutlineThickness;

                // Voisins : on cherche si un pixel opaque est proche
                float a = 0;
                a = max(a, tex2D(_MainTex, uv + float2( d,  0)).a);
                a = max(a, tex2D(_MainTex, uv + float2(-d,  0)).a);
                a = max(a, tex2D(_MainTex, uv + float2( 0,  d)).a);
                a = max(a, tex2D(_MainTex, uv + float2( 0, -d)).a);
                a = max(a, tex2D(_MainTex, uv + float2( d,  d)).a);
                a = max(a, tex2D(_MainTex, uv + float2(-d,  d)).a);
                a = max(a, tex2D(_MainTex, uv + float2( d, -d)).a);
                a = max(a, tex2D(_MainTex, uv + float2(-d, -d)).a);

                // Outline = voisin opaque, pondéré par la transparence du pixel courant
                // Plus le pixel est transparent, plus l'outline domine
                float outlineStrength = saturate(a) * (1.0 - col.a);

                // Blend progressif : sprite par-dessus, outline en dessous
                fixed4 result;
                result.rgb = lerp(_OutlineColor.rgb, col.rgb, col.a);
                result.a = saturate(col.a + outlineStrength * _OutlineColor.a);

                return result;
            }
            ENDCG
        }
    }
}
